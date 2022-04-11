const Product = require("../models/Product");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const { getSingleProductReviews } = require("./reviewController");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

const createProduct = async (req, res) => {
	req.body.user = req.user.userId;
	const product = await Product.create(req.body);
	res.status(StatusCodes.CREATED).json({ product });
};
const getAllProducts = async (req, res) => {
	const products = await Product.find({});
	res.status(StatusCodes.OK).json({ products, count: products.length });
};
const getSingleProduct = async (req, res) => {
	const { id: productId } = req.params;

	const product = await Product.findById(productId).populate("reviews");

	if (!product)
		throw new CustomError.NotFoundError(
			`No product found with id: ${productId}.`
		);

	res.status(StatusCodes.OK).json({ product });
};
const updateProduct = async (req, res) => {
	const { id: productId } = req.params;

	const product = await Product.findByIdAndUpdate(productId, req.body, {
		new: true,
		runValidators: true,
	});

	if (!product)
		throw new CustomError.NotFoundError(
			`No product found with id: ${productId}.`
		);

	res.status(StatusCodes.OK).json({ product });
};
const deleteProduct = async (req, res) => {
	const { id: productId } = req.params;

	const product = await Product.findById(productId);

	if (!product)
		throw new CustomError.NotFoundError(
			`No product found with id: ${productId}.`
		);
	await product.remove();

	res.status(StatusCodes.OK).json({ msg: "Success! Product Removed." });
};
const uploadImage = async (req, res) => {
	if (!req.files) throw new CustomError.BadRequestError("No file upload.");

	if (!req.files.image.mimetype.startsWith("image"))
		throw new CustomError.BadRequestError("Please Upload Image.");

	const maxSize = 1024 * 1024;
	const productImage = req.files.image;

	if (productImage.size > maxSize)
		throw new CustomError.BadRequestError(
			"Please upload image smaller than 1MB."
		);

	const result = await cloudinary.uploader.upload(
		req.files.image.tempFilePath,
		{
			use_filename: true,
			folder: "e-commerce-api-uploads",
		}
	);
	// REMOVE FILE FROM TEMP FOLDER
	fs.unlinkSync(req.files.image.tempFilePath);
	res.status(StatusCodes.OK).json({ image: { src: result.secure_url } });
};

module.exports = {
	createProduct,
	getAllProducts,
	getSingleProduct,
	updateProduct,
	deleteProduct,
	uploadImage,
};
