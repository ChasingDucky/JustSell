import { Request, Response } from 'express';
import { notFoundResponse } from '../utils/response';

export const notFoundHandler = (req: Request, res: Response): void => {
  notFoundResponse(res, `Route ${req.url} not found`);
};
