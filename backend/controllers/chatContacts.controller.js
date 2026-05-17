const { asyncHandler } = require('../middlewares/asyncHandler');
const {
  searchGarageContacts,
  searchVendeurContacts,
  searchAutomobilisteContacts
} = require('../models/chat.model');

const clampLimit = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return 20;
  }

  return Math.min(parsed, 50);
};

const listChatContacts = asyncHandler(async (req, res) => {
  const role = req.user?.role;
  const currentUserId = Number(req.user?.id);
  const q = String(req.query?.q || '').trim();
  const limit = clampLimit(req.query?.limit);

  if (!['automobiliste', 'garage', 'vendeur', 'admin'].includes(role)) {
    return res.status(403).json({
      success: false,
      message: 'Role non autorise pour la recherche de contacts chat',
      code: 'FORBIDDEN_ROLE'
    });
  }

  if (role === 'automobiliste' || role === 'admin') {
    const [garages, vendeurs] = await Promise.all([
      searchGarageContacts({ query: q, limit }),
      searchVendeurContacts({ query: q, limit })
    ]);

    return res.json({
      success: true,
      data: {
        role,
        items: [
          ...garages
            .filter((item) => Number(item.user_id) !== currentUserId)
            .map((item) => ({
              id: Number(item.user_id),
              role: 'garage',
              label: item.garage_name,
              subtitle: item.owner_email || item.garage_address || '',
              conversationType: 'automobiliste_garage',
              startPayload: { garageId: Number(item.garage_id) }
            })),
          ...vendeurs
            .filter((item) => Number(item.id) !== currentUserId)
            .map((item) => ({
              id: Number(item.id),
              role: 'vendeur',
              label: item.store_name || item.name,
              subtitle: item.email || item.store_address || '',
              conversationType: 'automobiliste_vendeur',
              startPayload: { vendeurId: Number(item.id) }
            }))
        ]
      }
    });
  }

  const itemsSource = role === 'garage'
    ? await searchVendeurContacts({ query: q, limit })
    : await searchAutomobilisteContacts({ query: q, limit });

  const items = itemsSource
    .filter((item) => Number(item.id) !== currentUserId)
    .map((item) => {
      if (role === 'garage') {
        return {
          id: Number(item.id),
          role: 'vendeur',
          label: item.store_name || item.name,
          subtitle: item.email || item.store_address || '',
          conversationType: 'garage_vendeur',
          startPayload: { vendeurId: Number(item.id) }
        };
      }

      return {
        id: Number(item.id),
        role: 'automobiliste',
        label: item.name,
        subtitle: item.email || item.phone || '',
        conversationType: 'automobiliste_vendeur',
        startPayload: { automobilisteId: Number(item.id) }
      };
    });

  return res.json({
    success: true,
    data: {
      role,
      items
    }
  });
});

module.exports = {
  listChatContacts
};


