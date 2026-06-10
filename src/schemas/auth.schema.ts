import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

const eighteenYearsAgo = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().slice(0, 10);
};

export const registerSchema = z
  .object({
    name: z.string().min(1, "Full name is required"),
    email: z.string().min(1, "Email is required").email("Enter a valid email"),
    phone: z.string().min(1, "Phone number is required"),
    date_of_birth: z
      .string()
      .min(1, "Date of birth is required")
      .refine(
        (val) => val <= eighteenYearsAgo(),
        "You must be at least 18 years old to register",
      ),
    gender: z.string().min(1, "Please select a gender"),
    identification_type: z.string().min(1, "ID type is required"),
    identification_number: z
      .string()
      .min(1, "Identification number is required"),
    nck_number: z.string().min(1, "NCK license number is required"),
    professional_qualification: z
      .string()
      .min(1, "Professional qualification is required"),
    designation: z.string().min(1, "Designation is required"),
    place_of_work: z.string().min(1, "Place of work is required"),
    county: z.string().min(1, "County is required"),
    employer_type: z.string().min(1, "Employer type is required"),
    chapter: z.string().optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    password_confirmation: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const branchMemberSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  phone: z.string().min(1, "Phone number is required"),
  date_of_birth: z
    .string()
    .min(1, "Date of birth is required")
    .refine(
      (val) => val <= eighteenYearsAgo(),
      "You must be at least 18 years old to register",
    ),
  gender: z.string().min(1, "Please select a gender"),
  identification_type: z.string().min(1, "ID type is required"),
  identification_number: z
    .string()
    .min(1, "Identification number is required"),
  nck_number: z.string().min(1, "NCK license number is required"),
  professional_qualification: z
    .string()
    .min(1, "Professional qualification is required"),
  designation: z.string().min(1, "Designation is required"),
  place_of_work: z.string().min(1, "Place of work is required"),
  county: z.string().min(1, "County is required"),
    employer_type: z.string().min(1, "Employer type is required"),
    chapter: z.string().optional(),
  });

export type BranchMemberFormValues = z.infer<typeof branchMemberSchema>;
