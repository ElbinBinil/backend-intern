import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadFile, deleteFile } from "../utils/fileupload.js";
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
  if (!email && !phone_no) {
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
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
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
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const modifyName = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name) {
    throw new ApiError(401, "Name is required!!");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        name: name,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account updated successfully"));
});

const modifyImage = asyncHandler(async (req, res) => {
  const profileImageLocalPath = req.file?.path;

  if (!profileImageLocalPath) {
    throw new ApiError(400, "An image is required!");
  }

  const profile_img = (await uploadFile(profileImageLocalPath)).downloadURL;

  if (!profile_img) {
    throw new ApiError(400, "Error occured while uploading!");
  }

  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        profileImage: profile_img,
      },
    },
    { new: true }
  ).select("-password");
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        _id: user._id,
        name: user.name,
      },
      "Profile image updated successfully"
    )
  );
});

const deleteUser = asyncHandler(async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user?._id);
    // console.log(user.profileImage);
    if (!user) {
      throw new ApiError(404, "No user found");
    }
    // await deleteFile(user.profileImage); <-- Either you could use this function to delete the image
  } catch (error) {
    throw new ApiError(400, "Error while deleting the user");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "User deleted successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  modifyName,
  modifyImage,
  deleteUser,
};
