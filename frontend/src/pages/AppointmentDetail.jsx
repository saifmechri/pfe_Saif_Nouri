import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import "dayjs/locale/fr";
import PlatformLayout from "../components/PlatformLayout";
import TopBar from "../components/TopBar";
import { getAppointment, listAppointments, updateAppointment } from "../services/appointments";
import { ArrowLeft, Send, CheckCircle, AlertCircle, Calendar, Clock, MapPin, User, MessageSquare } from "lucide-react";
import { formatAppointmentDate, parseAppointmentNotes } from "../utils/appointmentConstants";

dayjs.extend(localizedFormat);
dayjs.locale("fr");

const AppointmentDetail = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [automobilisteName, setAutomobilisteName] = useState("");
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showProposal, setShowProposal] = useState(false);
  const [proposalDate, setProposalDate] = useState(dayjs().add(3, "day").format("YYYY-MM-DD"));
  const [proposalTime, setProposalTime] = useState("14:00");
  const [proposalNote, setProposalNote] = useState("");
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // Fetch appointment details
  useEffect(() => {
    const fetchAppointmentDetail = async () => {
      try {
        setLoading(true);
        let apt = null;
        let payload = {};

        try {
          const res = await getAppointment(appointmentId);
          payload = res.data?.data || res.data || {};
          apt = payload?.appointment || null;
        } catch (err) {
          if (err?.response?.status === 404) {
            const res = await listAppointments({ limit: 100 });
            const items = res.data?.data?.items || res.data?.data || [];
            const list = Array.isArray(items) ? items : [];
            apt = list.find((item) => Number(item.id) === Number(appointmentId)) || null;
          } else {
            throw err;
          }
        }

        if (apt) {
          setAppointment(apt);
          const garageProfile = payload?.automobiliste || null;
          setAutomobilisteName(
            garageProfile?.name ||
              garageProfile?.nom ||
              garageProfile?.prenom ||
              `Automobiliste #${apt.automobiliste_user_id}`
          );

          // Parse notes for messages if they exist
          if (apt.notes) {
            const parsedNotes = parseAppointmentNotes(apt.notes);
            if (parsedNotes.messages.length > 0) {
              setMessages(parsedNotes.messages);
            }
          }
        } else {
          setMessage("Rendez-vous non trouvé");
          setMessageType("error");
        }
      } catch (err) {
        console.error("Error fetching appointment:", err);
        setMessage("Erreur lors du chargement du rendez-vous");
        setMessageType("error");
      } finally {
        setLoading(false);
      }
    };

    // Get user role from localStorage or component state
    const storedRole = localStorage.getItem("userRole") || "garage";
    setUserRole(storedRole);

    fetchAppointmentDetail();
  }, [appointmentId]);

  const handleDecision = async (decision) => {
    try {
      setActionLoading(true);
      const status = decision === "accept" ? "confirmed" : "cancelled";
      await updateAppointment(appointmentId, { status });
      
      setMessage(status === "confirmed" ? "✅ Rendez-vous confirmé" : "❌ Rendez-vous refusé");
      setMessageType("success");
      
      setTimeout(() => {
        navigate(-1);
      }, 2000);
    } catch (err) {
      console.error("Error:", err);
      setMessage("Erreur lors de la mise à jour");
      setMessageType("error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleProposalSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await updateAppointment(appointmentId, {
        status: "proposed",
        proposed_date: proposalDate,
        proposed_time: proposalTime,
        proposed_note: proposalNote
      });
      
      setMessage("✅ Proposition envoyée à l'automobiliste");
      setMessageType("success");
      setShowProposal(false);
      
      setTimeout(() => {
        navigate(-1);
      }, 2000);
    } catch (err) {
      console.error("Error:", err);
      setMessage("Erreur lors de l'envoi de la proposition");
      setMessageType("error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setActionLoading(true);
      const updatedMessages = [
        ...messages,
        {
          id: Date.now(),
          sender: userRole,
          text: newMessage,
          timestamp: new Date().toISOString()
        }
      ];

      const notes = {
        ...parseAppointmentNotes(appointment.notes),
        messages: updatedMessages
      };

      await updateAppointment(appointmentId, {
        notes: JSON.stringify(notes)
      });

      setMessages(updatedMessages);
      setNewMessage("");
      setMessage("✅ Message envoyé");
      setMessageType("success");
    } catch (err) {
      console.error("Error sending message:", err);
      setMessage("Erreur lors de l'envoi du message");
      setMessageType("error");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <PlatformLayout>
        <TopBar onLogout={() => navigate("/login")} />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
          <p className="text-slate-600">Chargement du rendez-vous...</p>
        </div>
      </PlatformLayout>
    );
  }

  if (!appointment) {
    return (
      <PlatformLayout>
        <TopBar onLogout={() => navigate("/login")} />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="text-center">
            <p className="text-red-600 font-semibold">Rendez-vous non trouvé</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Retour
            </button>
          </div>
        </div>
      </PlatformLayout>
    );
  }

  const appointmentDateTime = dayjs(`${appointment.appointment_date}T${appointment.appointment_time || "12:00"}`);
  const parsedNotes = parseAppointmentNotes(appointment.notes);
  const statusColor = {
    pending: "bg-amber-50 border-amber-200 text-amber-700",
    confirmed: "bg-emerald-50 border-emerald-200 text-emerald-700",
    cancelled: "bg-rose-50 border-rose-200 text-rose-700",
    proposed: "bg-blue-50 border-blue-200 text-blue-700"
  };

  const isPending = appointment.status === "pending";
  const isGarage = userRole === "garage";
  const canRespond = isPending && isGarage;

  return (
    <PlatformLayout>
      <TopBar onLogout={() => navigate("/login")} />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
        <div className="mx-auto max-w-4xl px-4">
          {/* Header */}
          <div className="mb-6 flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-slate-600 transition"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-3xl font-bold text-slate-900">Détails du Rendez-vous</h1>
          </div>

          {/* Main Content */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Details Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Status Card */}
              <div className={`rounded-2xl border p-6 ${statusColor[appointment.status] || statusColor.pending}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold opacity-75">Statut du Rendez-vous</p>
                    <p className="mt-1 text-2xl font-bold">
                      {appointment.status === "confirmed" ? "✅ Confirmé" :
                       appointment.status === "cancelled" ? "❌ Annulé" :
                       appointment.status === "proposed" ? "📅 Proposition" :
                       "⏳ En attente"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-bold text-slate-900">Informations</h2>
                
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Date</p>
                    <p className="mt-2 flex items-center gap-2 text-base font-semibold text-slate-900">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      {formatAppointmentDate(appointment.appointment_date)}
                    </p>
                  </div>

                  {appointment.appointment_time && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Heure</p>
                      <p className="mt-2 flex items-center gap-2 text-base font-semibold text-slate-900">
                        <Clock className="h-5 w-5 text-blue-500" />
                        {appointment.appointment_time}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Automobiliste</p>
                    <p className="mt-2 flex items-center gap-2 text-base font-semibold text-slate-900">
                      <User className="h-5 w-5 text-blue-500" />
                      {automobilisteName}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Créé le</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">
                      {dayjs(appointment.created_at).isValid()
                        ? dayjs(appointment.created_at).format("D MMMM à HH:mm")
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description Card */}
              {appointment.description && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Description du Service</p>
                  <p className="mt-3 whitespace-pre-wrap text-base text-slate-700">
                    {appointment.description}
                  </p>
                </div>
              )}

              {parsedNotes.services.length > 0 && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-600">Services optionnels</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {parsedNotes.services.map((service) => (
                      <span key={service} className="rounded-full border border-blue-200 bg-white px-3 py-1 text-sm font-semibold text-blue-700">
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Proposed Alternative (if exists) */}
              {appointment.proposed_date && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-600">Proposition Garagiste</p>
                  <div className="mt-3 space-y-2">
                    <p className="flex items-center gap-2 font-semibold text-blue-900">
                      <Calendar className="h-5 w-5" />
                      {dayjs(appointment.proposed_date).format("D MMMM YYYY")} à {appointment.proposed_time}
                    </p>
                    {appointment.proposed_note && (
                      <p className="text-sm text-blue-800 italic">"{appointment.proposed_note}"</p>
                    )}
                  </div>
                </div>
              )}

              {/* Messages Section */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                  <h3 className="text-lg font-bold text-slate-900">Messages</h3>
                </div>

                {/* Messages List */}
                <div className="mb-4 max-h-96 space-y-3 overflow-y-auto bg-slate-50 rounded-lg p-4">
                  {messages.length === 0 ? (
                    <p className="text-center text-sm text-slate-500 py-4">Aucun message pour le moment</p>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`rounded-lg p-3 ${
                          msg.sender === userRole
                            ? "bg-blue-100 text-blue-900 ml-auto max-w-xs"
                            : "bg-white border border-slate-200 max-w-xs"
                        }`}
                      >
                        <p className="text-xs font-semibold opacity-75 mb-1">
                          {msg.sender === userRole ? "Vous" : "Autre partie"}
                        </p>
                        <p className="text-sm">{msg.text}</p>
                        <p className="text-xs opacity-60 mt-1">
                          {dayjs(msg.timestamp).format("HH:mm")}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input */}
                <div className="flex gap-2">
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Ajouter un message..."
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || actionLoading}
                    className="rounded-lg bg-blue-500 p-2 text-white hover:bg-blue-600 disabled:opacity-50 transition"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Message Display */}
              {message && (
                <div className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
                  messageType === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}>
                  <div className="flex items-center gap-2">
                    {messageType === "success" ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <AlertCircle className="h-5 w-5" />
                    )}
                    <p>{message}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions Sidebar */}
            {canRespond && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm h-fit">
                <p className="mb-4 text-lg font-bold text-slate-900">Votre Réponse</p>
                
                <div className="space-y-3">
                  <button
                    onClick={() => handleDecision("accept")}
                    disabled={actionLoading}
                    className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                  >
                    ✅ Accepter
                  </button>
                  
                  <button
                    onClick={() => handleDecision("reject")}
                    disabled={actionLoading}
                    className="w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                  >
                    ❌ Refuser
                  </button>
                  
                  <button
                    onClick={() => setShowProposal(!showProposal)}
                    disabled={actionLoading}
                    className="w-full rounded-xl border border-amber-300 bg-amber-100 px-4 py-3 font-semibold text-amber-700 transition hover:bg-amber-200 disabled:opacity-50"
                  >
                    📅 Proposer Autre Date
                  </button>
                </div>

                {/* Proposal Form */}
                {showProposal && (
                  <form onSubmit={handleProposalSubmit} className="mt-4 border-t border-slate-200 pt-4 space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-600">Nouvelle Date</label>
                      <input
                        type="date"
                        value={proposalDate}
                        onChange={(e) => setProposalDate(e.target.value)}
                        min={dayjs().format("YYYY-MM-DD")}
                        required
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-600">Heure</label>
                      <input
                        type="time"
                        value={proposalTime}
                        onChange={(e) => setProposalTime(e.target.value)}
                        min="08:00"
                        max="18:00"
                        required
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-600">Note (optionnel)</label>
                      <textarea
                        value={proposalNote}
                        onChange={(e) => setProposalNote(e.target.value)}
                        placeholder="Explication..."
                        rows={3}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowProposal(false)}
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="flex-1 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
                      >
                        Envoyer
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </PlatformLayout>
  );
};

export default AppointmentDetail;


