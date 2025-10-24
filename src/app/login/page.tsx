'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import Image from 'next/image';
import { loginFormType } from '@/types/login/loginSchema';
import { useLogin } from '../hooks/useAuth';

export default function LoginPage() {
  const { login, isPending, error } = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<loginFormType>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: loginFormType) => {
    login(data);
  };

  return (
    <div className="flex h-full min-h-screen w-full bg-[#a76549]">
      {/* Left Side - Brown Background - Hidden on mobile/tablet */}
      <div className="hidden justify-center lg:flex lg:h-screen lg:w-[50%]">
        <div className="relative h-[96%] w-full rounded-b-2xl bg-white">
          {/* Decorative Images */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-[21.6%] left-[32.3%] z-10 h-[52.5%] w-[48.4%]">
              <Image
                src="/images/circle-image-2.png"
                alt="Decorative circle"
                loading="lazy"
                fill
                className="object-contain"
                style={{
                  filter: 'drop-shadow(-27px 21px 15.4px rgba(0, 0, 0, 0.15))',
                }}
              />
            </div>
            <div className="absolute top-[38.9%] left-[19.0%] z-0 h-[35.2%] w-[32.6%]">
              <Image
                src="/images/circle-image-1.png"
                alt="Decorative circle"
                loading="lazy"
                fill
                className="object-contain"
                style={{
                  filter: 'drop-shadow(-9px 6px 17.3px rgba(0, 0, 0, 0.1))',
                }}
              />
            </div>
            <div className="absolute top-[20.3%] left-[61.1%] z-10 h-[21.1%] w-[28.1%]">
              <Image
                src="/images/vector-bg.png"
                alt="Vector background"
                fill
                loading="lazy"
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - White Background with Form */}
      <div className="flex flex-1 items-center justify-center bg-[#a76549] p-4 sm:p-6 lg:p-8">
        <div className="flex w-full max-w-[523px] flex-col items-center justify-center gap-[32px] rounded-3xl border bg-white px-[30px] py-[40px] sm:px-[60px] sm:py-[50px]">
          <div className="flex flex-col items-start gap-[16px] self-stretch">
            <h1 className="font-poppins text-[24px] font-semibold text-[#101828] sm:text-[28px]">
              Login to your account
            </h1>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex w-full max-w-[400px] flex-col items-start gap-[24px]"
          >
            {/* Email Field */}
            <div className="flex flex-col items-start gap-[12px] self-stretch">
              <div className="flex items-start gap-[12px] self-stretch">
                <label className="font-poppins text-[14px] font-normal text-[#344054] capitalize sm:text-[16px]">
                  Email
                </label>
              </div>
              <div className="flex h-[48px] items-center self-stretch rounded-[8px] border border-[#DFE2FC] px-[16px] py-[12px]">
                <input
                  type="email"
                  placeholder="email@example.com"
                  className="font-poppins flex-1 bg-transparent text-[14px] font-normal text-[#344054] outline-none placeholder:text-[#98A2B3]"
                  {...register('email', { required: 'Email is required' })}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="flex flex-col items-start gap-[12px] self-stretch">
              <div className="flex items-start gap-[12px] self-stretch">
                <label className="font-poppins text-[14px] font-normal text-[#344054] capitalize sm:text-[16px]">
                  Password
                </label>
              </div>
              <div className="flex h-[48px] items-center self-stretch rounded-[8px] border border-[#D0D5DD] px-[16px] py-[12px]">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="font-poppins flex-1 bg-transparent text-[14px] font-normal text-[#344054] outline-none placeholder:text-[#98A2B3]"
                  {...register('password', {
                    required: 'Password is required',
                  })}
                />
                <button
                  type="button"
                  className="ml-2 cursor-pointer transition-opacity hover:opacity-70"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <Image
                      src="/images/eye.svg"
                      alt="Hide password"
                      width={24}
                      height={24}
                    />
                  ) : (
                    <span className="text-lg">🙈</span>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500">
                  {errors.password.message}
                </p>
              )}

              <div className="flex justify-end self-stretch">
                <Link
                  href="/forgot-password"
                  className="font-poppins text-[14px] font-normal text-[#6172F3] capitalize hover:underline sm:text-[16px]"
                >
                  Forgot?
                </Link>
              </div>
            </div>

            {/* Login Button */}
            <div className="flex flex-col items-center gap-[24px] self-stretch">
              <button
                type="submit"
                className="flex h-[52px] w-full items-center justify-center gap-[5px] rounded-[8px] bg-[#A76549] px-[16px] py-[16px] transition-colors duration-200 hover:bg-[#8B5A3D] active:bg-[#7A4F35]"
                disabled={isPending}
              >
                <span className="font-poppins text-[16px] font-semibold text-[#FCFCFD]">
                  Login now
                </span>
              </button>
            </div>
            {error && <p className="text-xs text-red-500">{error.message}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}
