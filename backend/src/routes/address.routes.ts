import express, { Request, Response } from 'express';
import addressService from '../services/address.service';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// Create address
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const address = await addressService.createAddress({
      ...req.body,
      userId,
    });

    res.status(201).json({
      success: true,
      message: 'Address created successfully',
      data: address,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Get user's addresses
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const addresses = await addressService.getUserAddresses(userId);

    res.json({
      success: true,
      data: addresses,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Get default address
router.get('/default', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const address = await addressService.getDefaultAddress(userId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'No default address found',
      });
    }

    res.json({
      success: true,
      data: address,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Get address by ID
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const address = await addressService.getAddressById(id, userId);

    res.json({
      success: true,
      data: address,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
});

// Update address
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const address = await addressService.updateAddress(id, userId, req.body);

    res.json({
      success: true,
      message: 'Address updated successfully',
      data: address,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Set default address
router.post('/:id/set-default', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const address = await addressService.setDefaultAddress(id, userId);

    res.json({
      success: true,
      message: 'Default address updated successfully',
      data: address,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Delete address
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = await addressService.deleteAddress(id, userId);

    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Validate address
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { country, state, city, postalCode } = req.body;
    const validation = addressService.validateAddress({
      country,
      state,
      city,
      postalCode,
    });

    res.json({
      success: validation.valid,
      data: validation,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
