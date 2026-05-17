import { useState, useCallback, useEffect } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import { createAppointment, updateAppointment, deleteAppointment, listAppointments } from '../services/appointments';
import { getServicesByGarage, getVehicules, listGarages } from '../services/garage';
import { APPOINTMENT_STATUS } from '../utils/appointmentConstants';

dayjs.locale('fr');

/**
 * Hook for managing appointment form state and submission
 */
export const useAppointmentForm = (garageId = null, onSuccess = null) => {
  const [form, setForm] = useState({
    garageId: garageId || '',
    vehicleId: '',
    appointmentDate: dayjs().format('YYYY-MM-DD'),
    appointmentTime: '',
    description: '',
    remark: ''
  });

  const [selectedServices, setSelectedServices] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch services when garage changes
  useEffect(() => {
    if (!form.garageId) {
      setAvailableServices([]);
      return;
    }

    const fetchServices = async () => {
      try {
        const res = await getServicesByGarage(form.garageId);
        const items = res.data?.data?.items || res.data?.data || res.data || [];
        setAvailableServices(Array.isArray(items) ? items : []);
      } catch (err) {
        console.error('Error fetching services:', err);
        setAvailableServices([]);
      }
    };

    fetchServices();
  }, [form.garageId]);

  const handleChange = useCallback((event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError('');
  }, []);

  const toggleService = useCallback((serviceId) => {
    setSelectedServices((current) => {
      const id = String(serviceId);
      return current.includes(id) ? current.filter((s) => s !== id) : [...current, id];
    });
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setError('');
      setSuccess('');
      setLoading(true);

      try {
        // Validate required fields
        if (!form.garageId) {
          throw new Error('Veuillez sélectionner un garage');
        }
        if (!form.appointmentDate) {
          throw new Error('Veuillez sélectionner une date');
        }
        if (!form.description?.trim()) {
          throw new Error('Veuillez entrer une description');
        }

        const notesPayload = {
          vehicleId: form.vehicleId || null,
          services: selectedServices,
          remark: form.remark || ''
        };

        await createAppointment({
          garageId: Number(form.garageId),
          appointmentDate: form.appointmentDate,
          appointmentTime: form.appointmentTime,
          description: form.description,
          notes: JSON.stringify(notesPayload)
        });

        setSuccess('✅ Rendez-vous réservé avec succès');
        
        // Reset form
        setForm({
          garageId: garageId || '',
          vehicleId: '',
          appointmentDate: dayjs().format('YYYY-MM-DD'),
          appointmentTime: '',
          description: '',
          remark: ''
        });
        setSelectedServices([]);

        if (onSuccess) onSuccess();
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Erreur lors de la création');
      } finally {
        setLoading(false);
      }
    },
    [form, selectedServices, garageId, onSuccess]
  );

  const resetForm = useCallback(() => {
    setForm({
      garageId: garageId || '',
      vehicleId: '',
      appointmentDate: dayjs().format('YYYY-MM-DD'),
      appointmentTime: '',
      description: '',
      remark: ''
    });
    setSelectedServices([]);
    setError('');
    setSuccess('');
  }, [garageId]);

  return {
    form,
    setForm,
    handleChange,
    selectedServices,
    setSelectedServices,
    toggleService,
    availableServices,
    handleSubmit,
    loading,
    error,
    success,
    resetForm
  };
};

/**
 * Hook for managing appointments list and filtering
 */
export const useAppointments = (statusFilter = 'all') => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [garages, setGarages] = useState([]);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const res = await listAppointments(params);
      const items = res.data?.data?.items || res.data?.data || res.data || [];
      setAppointments(Array.isArray(items) ? items : []);
    } catch (err) {
      setError('Erreur lors du chargement des rendez-vous');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const fetchGarages = useCallback(async () => {
    try {
      const res = await listGarages({ limit: 100 });
      const items = res.data?.data?.items || res.data?.data || res.data || [];
      setGarages(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error('Error fetching garages:', err);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
    fetchGarages();
  }, [fetchAppointments, fetchGarages]);

  // Enrich appointments with garage names
  useEffect(() => {
    if (garages.length === 0 || appointments.length === 0) return;

    const garageMap = garages.reduce((acc, g) => {
      acc[Number(g.id)] = g.name || g.nom || `Garage ${g.id}`;
      return acc;
    }, {});

    setAppointments((prev) =>
      prev.map((a) => ({
        ...a,
        garage_name: garageMap[Number(a.garage_id)] || undefined
      }))
    );
  }, [garages]);

  const handleDelete = useCallback(
    async (id) => {
      if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) return;
      try {
        await deleteAppointment(id);
        setAppointments((prev) => prev.filter((a) => a.id !== id));
      } catch (err) {
        setError('Erreur lors de la suppression');
        console.error(err);
      }
    },
    []
  );

  const handleUpdateStatus = useCallback(
    async (id, status) => {
      try {
        await updateAppointment(id, { status });
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status } : a))
        );
      } catch (err) {
        setError('Erreur lors de la mise à jour');
        console.error(err);
      }
    },
    []
  );

  return {
    appointments,
    loading,
    error,
    setError,
    searchQuery,
    setSearchQuery,
    garages,
    fetchAppointments,
    handleDelete,
    handleUpdateStatus
  };
};

/**
 * Hook for managing garage appointment requests
 */
export const useGarageAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [garageId, setGarageId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchAppointments = useCallback(async (id, status = 'all') => {
    setLoading(true);
    setError('');
    try {
      const params = { garageId: id };
      if (status && status !== 'all') {
        params.status = status;
      }
      const res = await listAppointments(params);
      const items = res.data?.data?.items || res.data?.data || res.data || [];
      setAppointments(Array.isArray(items) ? items : []);
    } catch (err) {
      setError('Erreur lors du chargement des demandes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDecision = useCallback(
    async (id, decision) => {
      try {
        const status = decision === 'accept' ? APPOINTMENT_STATUS.CONFIRMED : APPOINTMENT_STATUS.CANCELLED;
        await updateAppointment(id, { status });
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status } : a))
        );
      } catch (err) {
        setError('Erreur lors de la mise à jour');
        console.error(err);
      }
    },
    []
  );

  return {
    appointments,
    garageId,
    setGarageId,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    fetchAppointments,
    handleDecision
  };
};


