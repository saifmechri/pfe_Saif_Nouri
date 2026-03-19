const { Intervention, Piece, InterventionPiece, Vehicle } = require('../models');
const { validationResult } = require('express-validator');

// Vérifier que le véhicule appartient à l'utilisateur connecté
const checkVehicleOwnership = async (vehicleId, userId) => {
  const vehicle = await Vehicle.findOne({ where: { id: vehicleId, userId } });
  return !!vehicle;
};

// Créer une intervention
exports.createIntervention = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { vehicleId } = req.params;
  const { date_intervention, type, description, garage_nom, garage_adresse, kilometrage, pieces } = req.body;

  try {
    // Vérifier propriété du véhicule
    const isOwner = await checkVehicleOwnership(vehicleId, req.user.id);
    if (!isOwner) {
      return res.status(403).json({ message: 'Accès interdit à ce véhicule' });
    }

    // Créer l'intervention
    const intervention = await Intervention.create({
      vehicleId,
      date_intervention,
      type,
      description,
      garage_nom,
      garage_adresse,
      kilometrage,
      cout_total: 0 // sera recalculé après ajout des pièces
    });

    // Si des pièces sont fournies, les associer
    if (pieces && Array.isArray(pieces) && pieces.length > 0) {
      let total = 0;
      for (const item of pieces) {
        const piece = await Piece.findByPk(item.pieceId);
        if (!piece) {
          return res.status(400).json({ message: `Pièce id ${item.pieceId} introuvable` });
        }
        const prix_applique = item.prix_unitaire || piece.prix_unitaire;
        const quantite = item.quantite || 1;
        await InterventionPiece.create({
          interventionId: intervention.id,
          pieceId: item.pieceId,
          quantite,
          prix_unitaire_applique: prix_applique
        });
        total += prix_applique * quantite;
      }
      // Mettre à jour le coût total de l'intervention
      await intervention.update({ cout_total: total });
    }

    // Recharger l'intervention avec ses pièces
    const result = await Intervention.findByPk(intervention.id, {
      include: [{ model: Piece, as: 'pieces', through: { attributes: ['quantite', 'prix_unitaire_applique'] } }]
    });

    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Récupérer toutes les interventions d'un véhicule
exports.getInterventionsByVehicle = async (req, res) => {
  const { vehicleId } = req.params;
  try {
    const isOwner = await checkVehicleOwnership(vehicleId, req.user.id);
    if (!isOwner) {
      return res.status(403).json({ message: 'Accès interdit' });
    }
    const interventions = await Intervention.findAll({
      where: { vehicleId },
      include: [{ model: Piece, as: 'pieces', through: { attributes: ['quantite', 'prix_unitaire_applique'] } }],
      order: [['date_intervention', 'DESC']]
    });
    res.json(interventions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Récupérer une intervention par son ID
exports.getInterventionById = async (req, res) => {
  const { id } = req.params;
  try {
    const intervention = await Intervention.findByPk(id, {
      include: [{ model: Piece, as: 'pieces', through: { attributes: ['quantite', 'prix_unitaire_applique'] } }]
    });
    if (!intervention) {
      return res.status(404).json({ message: 'Intervention non trouvée' });
    }
    // Vérifier que le véhicule appartient à l'utilisateur
    const isOwner = await checkVehicleOwnership(intervention.vehicleId, req.user.id);
    if (!isOwner) {
      return res.status(403).json({ message: 'Accès interdit' });
    }
    res.json(intervention);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Mettre à jour une intervention (sans les pièces, pour simplifier)
exports.updateIntervention = async (req, res) => {
  const { id } = req.params;
  const { date_intervention, type, description, garage_nom, garage_adresse, kilometrage } = req.body;
  try {
    const intervention = await Intervention.findByPk(id);
    if (!intervention) {
      return res.status(404).json({ message: 'Intervention non trouvée' });
    }
    const isOwner = await checkVehicleOwnership(intervention.vehicleId, req.user.id);
    if (!isOwner) {
      return res.status(403).json({ message: 'Accès interdit' });
    }
    await intervention.update({ date_intervention, type, description, garage_nom, garage_adresse, kilometrage });
    res.json(intervention);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Supprimer une intervention
exports.deleteIntervention = async (req, res) => {
  const { id } = req.params;
  try {
    const intervention = await Intervention.findByPk(id);
    if (!intervention) {
      return res.status(404).json({ message: 'Intervention non trouvée' });
    }
    const isOwner = await checkVehicleOwnership(intervention.vehicleId, req.user.id);
    if (!isOwner) {
      return res.status(403).json({ message: 'Accès interdit' });
    }
    // Les enregistrements dans InterventionPiece seront supprimés automatiquement par la contrainte CASCADE (si configurée)
    await intervention.destroy();
    res.json({ message: 'Intervention supprimée' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Ajouter une pièce à une intervention existante
exports.addPieceToIntervention = async (req, res) => {
  const { id } = req.params; // id de l'intervention
  const { pieceId, quantite, prix_unitaire } = req.body;

  try {
    const intervention = await Intervention.findByPk(id);
    if (!intervention) {
      return res.status(404).json({ message: 'Intervention non trouvée' });
    }
    const isOwner = await checkVehicleOwnership(intervention.vehicleId, req.user.id);
    if (!isOwner) {
      return res.status(403).json({ message: 'Accès interdit' });
    }

    const piece = await Piece.findByPk(pieceId);
    if (!piece) {
      return res.status(404).json({ message: 'Pièce non trouvée' });
    }

    const prix_applique = prix_unitaire || piece.prix_unitaire;
    const qty = quantite || 1;

    // Vérifier si la pièce est déjà associée (pour éviter les doublons, on pourrait incrémenter la quantité)
    const existing = await InterventionPiece.findOne({ where: { interventionId: id, pieceId } });
    if (existing) {
      // Option : mettre à jour la quantité
      existing.quantite += qty;
      await existing.save();
    } else {
      await InterventionPiece.create({
        interventionId: id,
        pieceId,
        quantite: qty,
        prix_unitaire_applique: prix_applique
      });
    }

    // Recalculer le coût total de l'intervention
    const piecesAssociees = await InterventionPiece.findAll({ where: { interventionId: id } });
    const total = piecesAssociees.reduce((acc, p) => acc + (p.prix_unitaire_applique * p.quantite), 0);
    await intervention.update({ cout_total: total });

    const updated = await Intervention.findByPk(id, {
      include: [{ model: Piece, as: 'pieces', through: { attributes: ['quantite', 'prix_unitaire_applique'] } }]
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Retirer une pièce d'une intervention
exports.removePieceFromIntervention = async (req, res) => {
  const { id, pieceId } = req.params;
  try {
    const intervention = await Intervention.findByPk(id);
    if (!intervention) {
      return res.status(404).json({ message: 'Intervention non trouvée' });
    }
    const isOwner = await checkVehicleOwnership(intervention.vehicleId, req.user.id);
    if (!isOwner) {
      return res.status(403).json({ message: 'Accès interdit' });
    }

    await InterventionPiece.destroy({ where: { interventionId: id, pieceId } });

    // Recalculer le coût total
    const piecesAssociees = await InterventionPiece.findAll({ where: { interventionId: id } });
    const total = piecesAssociees.reduce((acc, p) => acc + (p.prix_unitaire_applique * p.quantite), 0);
    await intervention.update({ cout_total: total });

    const updated = await Intervention.findByPk(id, {
      include: [{ model: Piece, as: 'pieces', through: { attributes: ['quantite', 'prix_unitaire_applique'] } }]
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};