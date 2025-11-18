import { CardCode, Card } from '../models';
import { AppError } from '../middleware/errorHandler';
import { encryptCard, generateCardCode } from '../utils/encryption';
import { sequelize } from '../config/database';

export class InventoryService {
  /**
   * Add card codes to inventory
   */
  async addCardCodes(cardId: string, codes: Array<{ code: string; pin?: string }>) {
    const card = await Card.findByPk(cardId);
    if (!card) {
      throw new AppError('Card not found', 404);
    }

    const cardCodes = await Promise.all(
      codes.map(async ({ code, pin }) => {
        const encryptedCode = encryptCard(code);
        const encryptedPin = pin ? encryptCard(pin) : undefined;

        return CardCode.create({
          cardId,
          code: encryptedCode,
          pin: encryptedPin,
          status: 'available',
          expiresAt: card.validUntil,
        });
      })
    );

    // Update card stock
    await card.increment('stock', { by: codes.length });

    return cardCodes;
  }

  /**
   * Generate random card codes
   */
  async generateCardCodes(cardId: string, count: number) {
    const card = await Card.findByPk(cardId);
    if (!card) {
      throw new AppError('Card not found', 404);
    }

    const codes = Array.from({ length: count }, () => ({
      code: generateCardCode(16),
    }));

    return this.addCardCodes(cardId, codes);
  }

  /**
   * Get inventory status for a card
   */
  async getInventoryStatus(cardId: string) {
    const statuses = await CardCode.findAll({
      where: { cardId },
      attributes: [
        'status',
        [CardCode.sequelize!.fn('COUNT', CardCode.sequelize!.col('id')), 'count'],
      ],
      group: ['status'],
      raw: true,
    });

    const inventory: any = {
      available: 0,
      reserved: 0,
      sold: 0,
      used: 0,
      expired: 0,
    };

    (statuses as any).forEach((item: any) => {
      inventory[item.status] = parseInt(item.count);
    });

    inventory.total = Object.values(inventory).reduce((a: any, b: any) => a + b, 0);

    return inventory;
  }

  /**
   * Update card code status
   */
  async updateCardCodeStatus(codeId: string, status: CardCode['status']) {
    const cardCode = await CardCode.findByPk(codeId);
    if (!cardCode) {
      throw new AppError('Card code not found', 404);
    }

    await cardCode.update({ status });

    return cardCode;
  }

  /**
   * Get expiring cards (expiring in next N days)
   */
  async getExpiringCards(days: number = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const expiringCodes = await CardCode.findAll({
      where: {
        status: 'available',
        expiresAt: {
          [sequelize.Sequelize.Op.lte]: futureDate,
          [sequelize.Sequelize.Op.gte]: new Date(),
        },
      },
      include: [
        {
          model: Card,
          as: 'card',
          attributes: ['id', 'name', 'denomination'],
        },
      ],
    });

    return expiringCodes;
  }

  /**
   * Mark expired cards
   */
  async markExpiredCards() {
    const updated = await CardCode.update(
      { status: 'expired' },
      {
        where: {
          status: { [sequelize.Sequelize.Op.in]: ['available', 'reserved'] },
          expiresAt: { [sequelize.Sequelize.Op.lt]: new Date() },
        },
      }
    );

    return { updated: updated[0] };
  }

  /**
   * Get low stock alerts
   */
  async getLowStockAlerts(threshold: number = 10) {
    const cards = await Card.findAll({
      where: {
        status: 'active',
        stock: { [sequelize.Sequelize.Op.lte]: threshold },
      },
      attributes: ['id', 'name', 'stock', 'category'],
    });

    return cards;
  }

  /**
   * Bulk import card codes from CSV
   */
  async bulkImportCodes(cardId: string, csvData: string) {
    const lines = csvData.split('\n').filter((line) => line.trim());
    const codes = lines.map((line) => {
      const [code, pin] = line.split(',').map((s) => s.trim());
      return { code, pin: pin || undefined };
    });

    return this.addCardCodes(cardId, codes);
  }
}

export default new InventoryService();
