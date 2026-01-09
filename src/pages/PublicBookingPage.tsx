import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock, User, Mail, Phone, CheckCircle2, Loader2, Sparkles, GraduationCap, Target, Rocket } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import DOMPurify from "dompurify";

interface AvailabilitySlot {
  id: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  user_id: string;
}

interface BookingForm {
  name: string;
  email: string;
  phone: string;
  notes: string;
}

interface BookingSettings {
  title: string;
  description: string;
}

// Validation schema for booking form
const bookingSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo (máximo 100 caracteres)')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Nome contém caracteres inválidos'),
  email: z.string()
    .email('Email inválido')
    .max(255, 'Email muito longo'),
  phone: z.string()
    .optional()
    .refine(val => !val || /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{1,14}([-\s\.]?[0-9]{1,13})?$/.test(val.replace(/\s/g, '')), {
      message: 'Telefone inválido'
    }),
  notes: z.string()
    .max(1000, 'Observações muito longas (máximo 1000 caracteres)')
    .optional()
});

export function PublicBookingPage() {
  const { userId } = useParams<{ userId: string }>();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [allSlots, setAllSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [settings, setSettings] = useState<BookingSettings>({
    title: "Mentoria & Consultoria IDEA",
    description: "Transforme sua advocacia com inteligência artificial. Agende sua sessão exclusiva e descubra como a IA pode revolucionar seu escritório."
  });
  const [form, setForm] = useState<BookingForm>({
    name: "",
    email: "",
    phone: "",
    notes: ""
  });

  useEffect(() => {
    if (userId) {
      fetchSettings();
      fetchAllSlots();
    }
  }, [userId]);

  useEffect(() => {
    if (selectedDate && allSlots.length > 0) {
      const filtered = allSlots.filter(slot => {
        const slotDate = parseISO(slot.start_time);
        return isSameDay(slotDate, selectedDate) && !slot.is_booked;
      });
      setAvailableSlots(filtered);
      setSelectedSlot(null);
    }
  }, [selectedDate, allSlots]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("booking_page_settings" as any)
        .select("title, description")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setSettings({
          title: (data as any).title || settings.title,
          description: (data as any).description || settings.description
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const fetchAllSlots = async () => {
    try {
      const { data, error } = await supabase
        .from("calendar_availability" as any)
        .select("id, start_time, end_time, is_booked, user_id")
        .eq("user_id", userId)
        .eq("is_booked", false)
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true });

      if (error) throw error;
      setAllSlots((data as unknown as AvailabilitySlot[]) || []);
    } catch (error) {
      console.error("Error fetching slots:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDatesWithSlots = () => {
    const dates = new Set<string>();
    allSlots.forEach(slot => {
      const date = format(parseISO(slot.start_time), "yyyy-MM-dd");
      dates.add(date);
    });
    return dates;
  };

  const handleBooking = async () => {
    if (!selectedSlot) {
      toast.error("Selecione um horário");
      return;
    }

    // Validate input using zod
    const validation = bookingSchema.safeParse(form);
    if (!validation.success) {
      const errorMessage = validation.error.errors[0]?.message || "Dados inválidos";
      toast.error(errorMessage);
      return;
    }

    // Sanitize input data
    const sanitizedData = {
      name: DOMPurify.sanitize(form.name.trim(), { ALLOWED_TAGS: [] }),
      email: form.email.toLowerCase().trim(),
      phone: form.phone ? form.phone.replace(/[^\d+\-\s()]/g, '').trim() : '',
      notes: DOMPurify.sanitize(form.notes.trim(), { ALLOWED_TAGS: [] })
    };

    setBooking(true);
    try {
      // Mark slot as booked with sanitized data
      const { error: updateError } = await supabase
        .from("calendar_availability" as any)
        .update({ 
          is_booked: true,
          booked_by_name: sanitizedData.name,
          booked_by_email: sanitizedData.email,
          booked_by_phone: sanitizedData.phone,
          booking_notes: sanitizedData.notes
        } as any)
        .eq("id", selectedSlot.id);

      if (updateError) throw updateError;

      // Send WhatsApp notifications
      try {
        await supabase.functions.invoke('booking-notifications', {
          body: {
            action: 'booking-confirmation',
            userId: selectedSlot.user_id,
            bookingData: {
              name: sanitizedData.name,
              email: sanitizedData.email,
              phone: sanitizedData.phone,
              notes: sanitizedData.notes,
              startTime: selectedSlot.start_time,
              endTime: selectedSlot.end_time
            }
          }
        });
      } catch (notifError) {
        console.error("Error sending notifications:", notifError);
        // Don't fail the booking if notifications fail
      }

      setBooked(true);
      toast.success("Agendamento realizado com sucesso!");
    } catch (error) {
      console.error("Error booking:", error);
      toast.error("Erro ao realizar agendamento");
    } finally {
      setBooking(false);
    }
  };

  const datesWithSlots = getDatesWithSlots();

  if (booked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center bg-white/10 backdrop-blur-xl border-white/20 text-white">
          <CardHeader>
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mb-4 shadow-lg shadow-green-500/30">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              Agendamento Confirmado!
            </CardTitle>
            <CardDescription className="text-purple-200 text-lg">
              Você receberá uma confirmação via WhatsApp em breve.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-white/10 rounded-xl p-6 space-y-3 text-left border border-white/10">
              <div className="flex items-center gap-3 text-base">
                <CalendarIcon className="w-5 h-5 text-purple-300" />
                <span className="text-white/90">{selectedSlot && format(parseISO(selectedSlot.start_time), "EEEE, dd 'de' MMMM", { locale: ptBR })}</span>
              </div>
              <div className="flex items-center gap-3 text-base">
                <Clock className="w-5 h-5 text-purple-300" />
                <span className="text-white/90">
                  {selectedSlot && format(parseISO(selectedSlot.start_time), "HH:mm")} - 
                  {selectedSlot && format(parseISO(selectedSlot.end_time), "HH:mm")}
                </span>
              </div>
            </div>
            <p className="mt-6 text-sm text-purple-200">
              ✨ Prepare suas dúvidas e objetivos para aproveitarmos ao máximo nossa sessão!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Hero Header */}
        <header className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-3xl" />
          <div className="relative container mx-auto px-4 py-12">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-white/20">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-white/90">Vagas Limitadas</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                {settings.title}
              </h1>
              
              <p className="text-lg text-purple-200 mb-8 leading-relaxed">
                {settings.description}
              </p>

              <div className="flex flex-wrap justify-center gap-6 text-sm text-white/80">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-purple-400" />
                  <span>Mentoria Personalizada</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-pink-400" />
                  <span>Estratégias Práticas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-yellow-400" />
                  <span>Resultados Reais</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 -mt-4">
          <div className="max-w-4xl mx-auto">

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : allSlots.length === 0 ? (
              <Card className="text-center py-12 bg-white/10 backdrop-blur-xl border-white/20">
                <CardContent>
                  <CalendarIcon className="w-12 h-12 mx-auto text-purple-300 mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-white">Nenhum horário disponível</h3>
                  <p className="text-purple-200">
                    No momento não há horários disponíveis para agendamento.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Calendar */}
                <Card className="bg-white/10 backdrop-blur-xl border-white/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <CalendarIcon className="w-5 h-5 text-purple-400" />
                      Selecione uma Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      locale={ptBR}
                      disabled={(date) => {
                        const dateStr = format(date, "yyyy-MM-dd");
                        return !datesWithSlots.has(dateStr);
                      }}
                      modifiers={{
                        available: (date) => {
                          const dateStr = format(date, "yyyy-MM-dd");
                          return datesWithSlots.has(dateStr);
                        }
                      }}
                      modifiersStyles={{
                        available: {
                          backgroundColor: "rgba(168, 85, 247, 0.3)",
                          color: "white",
                          fontWeight: "bold"
                        }
                      }}
                      className="rounded-xl border border-white/20 bg-white/5 text-white [&_.rdp-day]:text-white [&_.rdp-head_cell]:text-purple-300 [&_.rdp-nav_button]:text-white [&_.rdp-caption]:text-white"
                    />

                    {selectedDate && (
                      <div className="mt-4 space-y-2">
                        <Label className="text-purple-200">Horários disponíveis</Label>
                        {availableSlots.length === 0 ? (
                          <p className="text-sm text-purple-300">
                            Nenhum horário disponível nesta data
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {availableSlots.map((slot) => (
                              <Badge
                                key={slot.id}
                                variant={selectedSlot?.id === slot.id ? "default" : "outline"}
                                className={`cursor-pointer transition-all px-3 py-2 ${
                                  selectedSlot?.id === slot.id 
                                    ? "bg-purple-500 text-white border-purple-400 shadow-lg shadow-purple-500/30" 
                                    : "bg-white/10 text-white border-white/30 hover:bg-purple-500/30"
                                }`}
                                onClick={() => setSelectedSlot(slot)}
                              >
                                <Clock className="w-3 h-3 mr-1" />
                                {format(parseISO(slot.start_time), "HH:mm")}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Booking Form */}
                <Card className="bg-white/10 backdrop-blur-xl border-white/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <User className="w-5 h-5 text-purple-400" />
                      Seus Dados
                    </CardTitle>
                    <CardDescription className="text-purple-200">
                      Preencha suas informações para confirmar o agendamento
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedSlot && (
                      <div className="bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-xl p-4 mb-4 border border-purple-400/30">
                        <p className="text-base font-medium text-white">
                          {format(parseISO(selectedSlot.start_time), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                        </p>
                        <p className="text-sm text-purple-200">
                          {format(parseISO(selectedSlot.start_time), "HH:mm")} - {format(parseISO(selectedSlot.end_time), "HH:mm")}
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-purple-200">Nome completo *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                        <Input
                          id="name"
                          placeholder="Seu nome"
                          className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-purple-300/50 focus:border-purple-400"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-purple-200">Email *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="seu@email.com"
                          className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-purple-300/50 focus:border-purple-400"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-purple-200">WhatsApp</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                        <Input
                          id="phone"
                          placeholder="(00) 00000-0000"
                          className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-purple-300/50 focus:border-purple-400"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes" className="text-purple-200">Observações</Label>
                      <Textarea
                        id="notes"
                        placeholder="Alguma informação adicional..."
                        rows={3}
                        className="bg-white/10 border-white/20 text-white placeholder:text-purple-300/50 focus:border-purple-400"
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      />
                    </div>

                    <Button
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-6 text-lg shadow-lg shadow-purple-500/30 transition-all hover:shadow-xl hover:shadow-purple-500/40"
                      size="lg"
                      disabled={!selectedSlot || !form.name || !form.email || booking}
                      onClick={handleBooking}
                    >
                      {booking ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Agendando...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5 mr-2" />
                          Confirmar Agendamento
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-white/10 mt-12 py-8">
          <div className="container mx-auto px-4 text-center">
            <p className="text-purple-300 text-sm">
              © 2024 IDEA - Inteligência Artificial para Advogados
            </p>
          </div>
        </footer>
      </div>
  );
}
