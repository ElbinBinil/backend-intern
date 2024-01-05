import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadFile } from "../utils/fileupload.js";
import { ApiResponse } from "../utils/ApiResponse.js";

import validator from "validator";

const registerUser = asyncHandler(async (req, res) => {
  const { email, phone_no, name, password } = req.body;

  // validation
  if (email && !validator.isEmail(email)) {
    throw new ApiError(400, "Provide an valid email");
  }

  if (phone_no && !validator.isMobilePhone(phone_no, "en-IN")) {
    throw new ApiError(400, "Provide an valid phone number");
  }

  if (!email && !phone_no) {
    throw new ApiError(
      400,
      "Please provide either email or phone number for signup"
    );
  }

  if ([name, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ phone_no }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or phone number already exists ");
  }

  const profileImageLocalPath = req.files?.profileImage[0]?.path;

  if (!profileImageLocalPath) {
    throw new ApiError(400, "Profile image is required!");
  }

  const profile_img = await uploadFile(profileImageLocalPath);

  if (!profile_img) {
    throw new ApiError(400, "Profile file is required");
  }

  const user = await User.create({
    email: email || "",
    phone_no: phone_no || "",
    name,
    profileImage: profile_img?.url,
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something wrong while registering a user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered !!"));
});

export { registerUser };
