import { Readable } from "node:stream";
import mongoose from "mongoose";
import slugify from "slugify";

import cloudinary from "../../config/cloudinary.js";
import Product from "./product.model.js";
import AppError from "../../utils/AppError.js";


// upload image 
const uploadImage = (file) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "flex-fashion-bd/products",
        resource_type: "image",
        transformation: [
          { width: 1600, height: 1600, crop: "limit" },
          { quality: "auto" },
          { fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          alt: "",
        });
      }
    );

    Readable.from(file.buffer).pipe(stream);
  });

const uploadImages = async (files = []) => {
  const uploaded = [];

  try {
    for (const file of files) {
      uploaded.push(await uploadImage(file));
    }

    return uploaded;
  } catch (error) {
    await deleteImages(uploaded);
    throw error;
  }
};

const deleteImages = async (images = []) => {
  const results = await Promise.allSettled(
    images.map((image) =>
      cloudinary.uploader.destroy(image.publicId, {
        resource_type: "image",
      })
    )
  );

  const failures = results.filter(
    (result) => result.status === "rejected"
  );

  if (failures.length) {
    console.error(
      `${failures.length} Cloudinary image deletion(s) failed`
    );
  }
};

const makeSlug = (name) =>
  slugify(name, {
    lower: true,
    strict: true,
    trim: true,
  });

const buildUniqueSlug = async (name, excludeId = null) => {
  const baseSlug = makeSlug(name) || "product";
  let slug = baseSlug;
  let counter = 1;

  while (
    await Product.exists({
      slug,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
  ) {
    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }

  return slug;
};

const ensureUniqueVariantSkus = (variants = []) => {
  const skus = variants.map((variant) =>
    variant.sku.trim().toUpperCase()
  );

  if (new Set(skus).size !== skus.length) {
    throw new AppError("Variant SKUs must be unique within a product", 400);
  }
};


// create product 
const createProduct = async (data, files, adminId) => {
  if (!files?.length) {
    throw new AppError("At least one product image is required", 400);
  }

  ensureUniqueVariantSkus(data.variants);

  const images = await uploadImages(files);

  try {
    const slug = await buildUniqueSlug(data.name);

    const product = await Product.create({
      ...data,
      slug,
      images,
      createdBy: adminId,
    });

    return product;
  } catch (error) {
    await deleteImages(images);
    throw error;
  }
};

const getProducts = async (query, isAdmin = false) => {
  const {
    page = 1,
    limit = 12,
    category,
    search,
    sort = "newest",
    status,
    featured,
  } = query;

  const filter = {};

  if (!isAdmin) {
    filter.status = "active";
  } else if (status) {
    filter.status = status;
  }

  if (category) filter.category = category;

  if (featured !== undefined) {
    filter.isFeatured = featured === "true";
  }

  if (search) {
    filter.$text = { $search: search };
  }

  const sortOptions = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
  };

  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .select("-costPrice")
      .sort(sortOptions[sort])
      .skip(skip)
      .limit(limit)
      .lean(),

    Product.countDocuments(filter),
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getProductById = async (id, isAdmin = false) => {
  const product = await Product.findById(id)
    .select("-costPrice")
    .lean();

  if (!product || (!isAdmin && product.status !== "active")) {
    throw new AppError("Product not found", 404);
  }

  return product;
};

const getProductBySlug = async (slug, isAdmin = false) => {
  const product = await Product.findOne({ slug })
    .select("-costPrice")
    .lean();

  if (!product || (!isAdmin && product.status !== "active")) {
    throw new AppError("Product not found", 404);
  }

  return product;
};

const updateProduct = async (id, data, files = []) => {
  const product = await Product.findById(id);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  if (data.variants) {
    ensureUniqueVariantSkus(data.variants);
  }

  const removeIds = data.removeImagePublicIds || [];
  const existingIds = new Set(
    product.images.map((image) => image.publicId)
  );

  for (const publicId of removeIds) {
    if (!existingIds.has(publicId)) {
      throw new AppError(
        "An image selected for removal does not belong to this product",
        400
      );
    }
  }

  const remainingImages = product.images.filter(
    (image) => !removeIds.includes(image.publicId)
  );

  if (remainingImages.length + files.length > 8) {
    throw new AppError("A product can have at most 8 images", 400);
  }

  if (remainingImages.length + files.length < 1) {
    throw new AppError("A product must have at least one image", 400);
  }

  const uploadedImages = await uploadImages(files);

  try {
    if (data.name && data.name !== product.name) {
      product.slug = await buildUniqueSlug(data.name, product._id);
    }

    const {
      removeImagePublicIds,
      ...fieldsToUpdate
    } = data;

    Object.assign(product, fieldsToUpdate);

    product.images = [
      ...remainingImages,
      ...uploadedImages,
    ];

    await product.save();

    // Delete removed assets only after the database update succeeds.
    await deleteImages(
      product.images.length
        ? [...product.images, ...[]].filter(() => false)
        : []
    );

    const removedImages = product.$locals.removedImages || [];
    await deleteImages(removedImages);

    return product;
  } catch (error) {
    await deleteImages(uploadedImages);
    throw error;
  }
};

const deleteProduct = async (id) => {
  const product = await Product.findById(id);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const images = product.images;

  await product.deleteOne();

  // Database deletion succeeds first. Cloudinary cleanup is best effort.
  await deleteImages(images);

  return { id: product._id };
};

export {
  createProduct,
  getProducts,
  getProductById,
  getProductBySlug,
  updateProduct,
  deleteProduct,
};