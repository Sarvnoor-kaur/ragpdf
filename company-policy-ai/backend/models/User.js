import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'hr', 'employee'],
        message: '{VALUE} is not a supported role',
      },
      default: 'employee',
    },
    department: {
      type: String,
      enum: {
        values: ['HR', 'IT', 'Finance', 'Engineering', 'Marketing', 'Management'],
        message: '{VALUE} is not a supported department',
      },
      default: 'Engineering',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Ensure password is never returned in API responses
userSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    delete ret.password;
    // Map _id to id for frontend consistency
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const User = mongoose.model('User', userSchema);

export default User;
