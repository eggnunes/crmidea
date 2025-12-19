-- Create table for calendar availability slots
CREATE TABLE public.calendar_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_booked BOOLEAN NOT NULL DEFAULT false,
  booked_by_name TEXT,
  booked_by_email TEXT,
  booked_by_phone TEXT,
  booking_notes TEXT,
  calendar_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.calendar_availability ENABLE ROW LEVEL SECURITY;

-- Policy for owners to manage their availability
CREATE POLICY "Users can manage their own availability"
ON public.calendar_availability
FOR ALL
USING (auth.uid() = user_id);

-- Policy for public to view available slots (not booked)
CREATE POLICY "Anyone can view available slots"
ON public.calendar_availability
FOR SELECT
USING (is_booked = false);

-- Policy for anyone to book a slot (update is_booked to true)
CREATE POLICY "Anyone can book available slots"
ON public.calendar_availability
FOR UPDATE
USING (is_booked = false)
WITH CHECK (is_booked = true);

-- Create trigger for updated_at
CREATE TRIGGER update_calendar_availability_updated_at
BEFORE UPDATE ON public.calendar_availability
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();