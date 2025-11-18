import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * Send success response
 */
export const successResponse = <T>(
  res: Response,
  message: string,
  data?: T,
  meta?: ApiResponse['meta']
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    meta,
  };
  return res.status(200).json(response);
};

/**
 * Send created response
 */
export const createdResponse = <T>(
  res: Response,
  message: string,
  data?: T
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  return res.status(201).json(response);
};

/**
 * Send error response
 */
export const errorResponse = (
  res: Response,
  message: string,
  statusCode: number = 400,
  error?: string
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    error,
  };
  return res.status(statusCode).json(response);
};

/**
 * Send validation error response
 */
export const validationErrorResponse = (
  res: Response,
  errors: any[]
): Response => {
  const response: ApiResponse = {
    success: false,
    message: 'Validation failed',
    error: errors,
  };
  return res.status(422).json(response);
};

/**
 * Send unauthorized response
 */
export const unauthorizedResponse = (
  res: Response,
  message: string = 'Unauthorized'
): Response => {
  return errorResponse(res, message, 401);
};

/**
 * Send forbidden response
 */
export const forbiddenResponse = (
  res: Response,
  message: string = 'Forbidden'
): Response => {
  return errorResponse(res, message, 403);
};

/**
 * Send not found response
 */
export const notFoundResponse = (
  res: Response,
  message: string = 'Resource not found'
): Response => {
  return errorResponse(res, message, 404);
};
