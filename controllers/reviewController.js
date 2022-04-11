const Review = require("../models/Review");
const Product = require("../models/Product");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const { checkPermissions } = require("../utils");

const createReview = async (req, res) => {
	const { product: productId } = req.body;
	const { userId } = req.user;

	const isProductExists = await Product.findById(productId);
	if (!isProductExists)
		throw new CustomError.NotFoundError(
			`No product found with id: ${productId}.`
		);
	const alreadySubmitted = await Review.findOne({
		product: productId,
		user: userId,
	});
	if (alreadySubmitted)
		throw new CustomError.BadRequestError(
			"Already submitted review for this product."
		);

	req.body.user = userId;
	const review = await Review.create(req.body);
	res.status(StatusCodes.CREATED).json({ review });
};
const getAllReviews = async (req, res) => {
	const reviews = await Review.find({}).populate({
		path: "product",
		select: "name price company",
	});
	res.status(StatusCodes.OK).json({ reviews, count: reviews.length });
};
const getSingleReview = async (req, res) => {
	const reviewId = req.params.id;
	const review = await Review.findById(reviewId).populate({
		path: "product",
		select: "name price company",
	});
	if (!review)
		throw new CustomError.NotFoundError(
			`No review found with id: ${reviewId}`
		);
	res.status(StatusCodes.OK).json({ review });
};

const updateReview = async (req, res) => {
	const { rating, title, comment } = req.body;
	const reviewId = req.params.id;

	const review = await Review.findById(reviewId);

	if (!review)
		throw new CustomError.NotFoundError(
			`No review found with id: ${reviewId}`
		);
	checkPermissions(req.user, review.user);

	review.rating = rating;
	review.title = title;
	review.comment = comment;
	await review.save();

	res.status(StatusCodes.OK).json({ review });
};
const deleteReview = async (req, res) => {
	const reviewId = req.params.id;

	const review = await Review.findById(reviewId);
	if (!review)
		throw new CustomError.NotFoundError(
			`No review found with id: ${reviewId}`
		);
	checkPermissions(req.user, review.user);
	await review.remove();
	res.status(StatusCodes.OK).json({ msg: "Success! Review Removed" });
};

const getSingleProductReviews = async (req, res) => {
	const { id: productId } = req.params;
	const reviews = await Review.find({ product: productId });
	res.status(StatusCodes.OK).json({ reviews, count: reviews.length });
};

module.exports = {
	createReview,
	getAllReviews,
	getSingleReview,
	updateReview,
	deleteReview,
	getSingleProductReviews,
};
