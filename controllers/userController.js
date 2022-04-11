const { StatusCodes } = require("http-status-codes");
const User = require("../models/User");
const CustomError = require("../errors");
const {
	createTokenUser,
	attachCookiesToResponse,
	checkPermissions,
} = require("../utils");

const getAllUsers = async (req, res) => {
	const users = await User.find({ role: "user" }).select("-password");

	res.status(StatusCodes.OK).json({ users });
};
const getSingleUser = async (req, res) => {
	const { id: userId } = req.params;
	const user = await User.findById(userId).select("-password");

	if (!user)
		throw new CustomError.NotFoundError(`No user with id: ${userId}.`);

	checkPermissions(req.user, user._id);
	res.status(StatusCodes.OK).json({ user });
};
const showCurrentUser = async (req, res) => {
	res.status(StatusCodes.OK).json({ user: req.user });
};
const updateUser = async (req, res) => {
	const { name, email } = req.body;
	if (!name || !email)
		throw new CustomError.BadRequestError("Please provide name and email");

	const { userId } = req.user;
	const user = await User.findById(userId);
	user.name = name;
	user.email = email;
	await user.save();

	const tokenUser = createTokenUser(user);
	attachCookiesToResponse({ payload: tokenUser, res });
	res.status(StatusCodes.OK).json({ user: tokenUser });
};
const updateUserPassword = async (req, res) => {
	const { newPassword, oldPassword } = req.body;

	if (!newPassword || !oldPassword)
		throw new CustomError.BadRequestError(
			"Please provide old password and new password."
		);

	const { userId } = req.user;

	const user = await User.findById(userId);
	const isPassValid = await user.comparePassword(oldPassword);

	if (!isPassValid)
		throw new CustomError.UnauthenticatedError("Invalid Credentials.");

	user.password = newPassword;
	await user.save();

	res.status(StatusCodes.OK).json({ msg: "Success! Password Updated." });
};

module.exports = {
	getAllUsers,
	getSingleUser,
	showCurrentUser,
	updateUser,
	updateUserPassword,
};
