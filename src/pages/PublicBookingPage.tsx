import { useState, useEffect } from "react";
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
import { Calendar as CalendarIcon, Clock, User, Mail, Phone, CheckCircle2, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";

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

export function PublicBookingPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [allSlots, setAllSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [form, setForm] = useState<BookingForm>({
    name: "",
    email: "",
    phone: "",
    notes: ""
  });

  useEffect(() => {
    fetchAllSlots();
  }, []);

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

  const fetchAllSlots = async () => {
    try {
      const { data, error } = await supabase
        .from("calendar_availability" as any)
        .select("id, start_time, end_time, is_booked, user_id")
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
    if (!selectedSlot || !form.name || !form.email) {
      toast.error("Preencha nome e email");
      return;
    }

    setBooking(true);
    try {
      // Mark slot as booked
      const { error: updateError } = await supabase
        .from("calendar_availability" as any)
        .update({ 
          is_booked: true,
          booked_by_name: form.name,
          booked_by_email: form.email,
          booked_by_phone: form.phone,
          booking_notes: form.notes
        } as any)
        .eq("id", selectedSlot.id);

      if (updateError) throw updateError;

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
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Agendamento Confirmado!</CardTitle>
            <CardDescription>
              Você receberá um email de confirmação em breve.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg p-4 space-y-2 text-left">
              <div className="flex items-center gap-2 text-sm">
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                <span>{selectedSlot && format(parseISO(selectedSlot.start_time), "EEEE, dd 'de' MMMM", { locale: ptBR })}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>
                  {selectedSlot && format(parseISO(selectedSlot.start_time), "HH:mm")} - 
                  {selectedSlot && format(parseISO(selectedSlot.end_time), "HH:mm")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        {/* Header */}
        <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-lg">CRM IDEA</h1>
                <p className="text-sm text-muted-foreground">Agende sua sessão</p>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Agende sua Sessão</h2>
              <p className="text-muted-foreground">
                Escolha um horário disponível para sua mentoria ou consultoria
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : allSlots.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum horário disponível</h3>
                  <p className="text-muted-foreground">
                    No momento não há horários disponíveis para agendamento.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Calendar */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5" />
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
                          backgroundColor: "hsl(var(--primary) / 0.1)",
                          color: "hsl(var(--primary))",
                          fontWeight: "bold"
                        }
                      }}
                      className="rounded-md border"
                    />

                    {selectedDate && (
                      <div className="mt-4 space-y-2">
                        <Label>Horários disponíveis</Label>
                        {availableSlots.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            Nenhum horário disponível nesta data
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {availableSlots.map((slot) => (
                              <Badge
                                key={slot.id}
                                variant={selectedSlot?.id === slot.id ? "default" : "outline"}
                                className="cursor-pointer hover:bg-primary/20 transition-colors px-3 py-1"
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
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Seus Dados
                    </CardTitle>
                    <CardDescription>
                      Preencha suas informações para confirmar o agendamento
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedSlot && (
                      <div className="bg-primary/10 rounded-lg p-3 mb-4">
                        <p className="text-sm font-medium text-primary">
                          {format(parseISO(selectedSlot.start_time), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                        </p>
                        <p className="text-sm text-primary/80">
                          {format(parseISO(selectedSlot.start_time), "HH:mm")} - {format(parseISO(selectedSlot.end_time), "HH:mm")}
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="name">Nome completo *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="name"
                          placeholder="Seu nome"
                          className="pl-10"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="seu@email.com"
                          className="pl-10"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">WhatsApp</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          placeholder="(00) 00000-0000"
                          className="pl-10"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Observações</Label>
                      <Textarea
                        id="notes"
                        placeholder="Alguma informação adicional..."
                        rows={3}
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      />
                    </div>

                    <Button
                      className="w-full"
                      size="lg"
                      disabled={!selectedSlot || !form.name || !form.email || booking}
                      onClick={handleBooking}
                    >
                      {booking ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Agendando...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
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
      </div>
  );
}
