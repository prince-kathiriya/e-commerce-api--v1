const express = require("express");
const router = express.Router();

const {
	getAllUsers,
	showCurrentUser,
	updateUser,
	updateUserPassword,
	getSingleUser,
} = require("../controllers/userController");
const {
	authenticateUser,
	authorizePermission,
} = require("../middleware/authentication");

router
	.route("/")
	.get(authenticateUser, authorizePermission("admin"), getAllUsers);

router.route("/showMe").get(authenticateUser, showCurrentUser);
router.route("/updateUser").patch(authenticateUser, updateUser);
router.route("/updateUserPassword").patch(authenticateUser, updateUserPassword);

// Note: ':id; is placed at the end 'cause after '/api/v1/ <- here anything is treated as id for instance 'showMe' will be treated as a id so to avoid that we place at the end.
router.route("/:id").get(authenticateUser, getSingleUser);

module.exports = router;
