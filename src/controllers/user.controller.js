import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadFile } from "../utils/fileupload.js";
import { ApiResponse } from "../utils/ApiResponse.js";

import validator from "validator";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong ..... While genreating tokens"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { email, phone_no, name, password } = req.body;

  // validation
  if (email && !validator.isEmail(email)) {
    throw new ApiError(400, "Provide an valid email");
  }

  if (phone_no && !validator.isMobilePhone(phone_no, "en-IN")) {
    throw new ApiError(400, "Provide an valid phone number");
  }

  // console.log(req.body);

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

  // console.log(req.file);
  const profileImageLocalPath = req.file?.path;

  if (!profileImageLocalPath) {
    throw new ApiError(400, "Profile image is required!");
  }

  const profile_img = (await uploadFile(profileImageLocalPath)).downloadURL;

  // console.log(profile_img.downloadURL);

  if (!profile_img) {
    throw new ApiError(400, "Profile file is required");
  }

  const user = await User.create({
    email: email || "",
    phone_no: phone_no || "",
    name,
    profileImage: profile_img,
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

const loginUser = asyncHandler(async (req, res) => {
  const { email, phone_no, password } = req.body;
  if (!email || !phone_no) {
    throw new ApiError(400, "Either email or phone number is required");
  }

  const user = await User.findOne({
    $or: [{ email }, { phone_no }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist!");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Password was incorrect!");
  }

  // genearates access token and refresh token if login is successfull
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cokkie("accessToken", accessToken, options)
    .cokkie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in !!!"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCokkie("accessToken", options)
    .clearCokkie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});

export { registerUser, loginUser, logoutUser };
