const Review = require("../models/Review");
const Order = require("../models/Order");
const Product = require("../models/Product");
const CustomError = require("../errors");
const { StatusCodes } = require("http-status-codes");
const { checkPermissions } = require("../utils");

const fackStripAPI = async ({ amount, currency }) => {
	const client_secret = "@#RHIhi8f233";
	return { client_secret, amount };
};

const createOrder = async (req, res) => {
	const { items: cartItems, tax, shippingFee } = req.body;

	if (!cartItems || cartItems.length < 1)
		throw new CustomError.BadRequestError("No cart items provided.");
	if (!tax || !shippingFee)
		throw new CustomError.BadRequestError(
			"Please provide tax and shipping fee."
		);

	let orderItems = [];
	let subtotal = 0;
	for (const item of cartItems) {
		const dbProduct = await Product.findOne({ _id: item.product });
		if (!dbProduct)
			throw new CustomError.NotFoundError(
				`No product found with id: ${item.product}`
			);
		const { name, price, image, _id } = dbProduct;
		const singleOrderItem = {
			amount: item.amount,
			name,
			price,
			image,
			product: _id,
		};
		orderItems = [...orderItems, singleOrderItem];
		subtotal += item.amount * price;
	}
	const total = tax + shippingFee + subtotal;
	// It requires front-end in order to use strip api so using fake one here...
	const paymentIntent = await fackStripAPI({
		amount: total,
		currency: "usd",
	});
	const order = await Order.create({
		orderItems,
		total,
		subtotal,
		tax,
		shippingFee,
		clientSecret: paymentIntent.client_secret,
		user: req.user.userId,
	});
	res.status(StatusCodes.CREATED).json({
		order,
		clientSecret: order.clientSecret,
	});
};

const getAllOrders = async (req, res) => {
	const orders = await Order.find({});
	res.status(StatusCodes.OK).json({ orders, count: orders.length });
};
const getSingleOrder = async (req, res) => {
	const { id: orderId } = req.params;
	const order = await Order.findById(orderId);
	if (!order)
		throw new CustomError.NotFoundError(`No order with id: ${orderId}`);
	checkPermissions(req.user, order.user);
	res.status(StatusCodes.OK).json({ order });
};
const getCurrentUserOrders = async (req, res) => {
	const orders = await Order.find({ user: req.user.userId });
	res.status(StatusCodes.OK).json({ orders, count: orders.length });
};
const updateOrder = async (req, res) => {
	const { id: orderId } = req.params;
	const { paymentIntentId } = req.body;
	if (!paymentIntentId)
		throw new CustomError.BadRequestError(
			"Please provide paymentIntentId."
		);
	const order = await Order.findById(orderId);
	if (!order)
		throw new CustomError.NotFoundError(`No order with id: ${orderId}`);
	checkPermissions(req.user, order.user);

	order.paymentIntentId = paymentIntentId;
	order.status = "paid";
	await order.save();

	res.status(StatusCodes.OK).json({ order });
};

module.exports = {
	getAllOrders,
	getSingleOrder,
	getCurrentUserOrders,
	createOrder,
	updateOrder,
};
