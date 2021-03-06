const bcryptjs = require("bcryptjs");
const { default: mongoose } = require("mongoose");
const validator = require("validator");

const UserSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, "Please provide a name."],
		trim: true,
		minlength: 3,
		maxlength: 50,
	},
	email: {
		type: String,
		unique: true,
		required: [true, "Please provide a email."],
		trim: true,
		validate: {
			validator: validator.isEmail,
			message: "Please provide valid email",
		},
	},
	password: {
		type: String,
		required: [true, "Please provide a password."],
		minlength: 6,
	},
	role: {
		type: String,
		enum: ["admin", "user"],
		default: "user",
	},
});

UserSchema.pre("save", async function () {
	if (!this.isModified("password")) return;
	// hash only if pass is modified
	const salt = await bcryptjs.genSalt(10);
	this.password = await bcryptjs.hash(this.password, salt);
});

UserSchema.methods.comparePassword = async function (passwordProvided) {
	const isMatch = await bcryptjs.compare(passwordProvided, this.password);
	return isMatch;
};
module.exports = mongoose.model("User", UserSchema);
