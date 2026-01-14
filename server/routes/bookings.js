const express = require('express');
const router = express.Router();
const { supabase } = require('../utils/supabase');
const { authenticateToken } = require('../utils/auth');

// Get all bookings for the authenticated user
router.get('/my-bookings', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        *,
        rooms (
          id,
          name,
          description,
          capacity
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'confirmed')
      .order('start_time', { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ bookings });
  } catch (error) {
    console.error('Get my bookings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all bookings (admin/public view)
router.get('/', async (req, res) => {
  try {
    const { room_id, start_date, end_date } = req.query;

    let query = supabase
      .from('bookings')
      .select(`
        *,
        rooms (
          id,
          name
        ),
        profiles (
          email,
          full_name
        )
      `)
      .eq('status', 'confirmed');

    if (room_id) {
      query = query.eq('room_id', room_id);
    }

    if (start_date) {
      query = query.gte('start_time', start_date);
    }

    if (end_date) {
      query = query.lte('end_time', end_date);
    }

    const { data: bookings, error } = await query.order('start_time');

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ bookings });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a single booking
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        rooms (
          id,
          name,
          description,
          capacity,
          equipment
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if user owns this booking
    if (booking.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view this booking' });
    }

    res.json({ booking });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new booking
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { room_id, start_time, end_time } = req.body;
    const userId = req.user.id;

    if (!room_id || !start_time || !end_time) {
      return res.status(400).json({
        error: 'Room ID, start time, and end time are required'
      });
    }

    // Validate time range
    const start = new Date(start_time);
    const end = new Date(end_time);

    if (end <= start) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    // Check for conflicts
    const { data: conflictCheck } = await supabase
      .rpc('check_booking_conflict', {
        p_room_id: room_id,
        p_start_time: start_time,
        p_end_time: end_time
      });

    if (conflictCheck) {
      return res.status(409).json({
        error: 'This time slot is already booked for this room'
      });
    }

    // Create the booking
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        room_id,
        user_id: userId,
        start_time,
        end_time,
        status: 'confirmed'
      })
      .select(`
        *,
        rooms (
          id,
          name,
          description
        )
      `)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a booking
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { start_time, end_time } = req.body;
    const userId = req.user.id;

    // Check if booking exists and user owns it
    const { data: existingBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingBooking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (existingBooking.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this booking' });
    }

    // Validate time range if provided
    if (start_time && end_time) {
      const start = new Date(start_time);
      const end = new Date(end_time);

      if (end <= start) {
        return res.status(400).json({ error: 'End time must be after start time' });
      }

      // Check for conflicts
      const { data: conflictCheck } = await supabase
        .rpc('check_booking_conflict', {
          p_room_id: existingBooking.room_id,
          p_start_time: start_time,
          p_end_time: end_time,
          p_booking_id: id
        });

      if (conflictCheck) {
        return res.status(409).json({
          error: 'This time slot is already booked for this room'
        });
      }
    }

    // Update the booking
    const updates = {};
    if (start_time) updates.start_time = start_time;
    if (end_time) updates.end_time = end_time;

    const { data: booking, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        rooms (
          id,
          name,
          description
        )
      `)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: 'Booking updated successfully',
      booking
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel a booking
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if booking exists and user owns it
    const { data: existingBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingBooking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (existingBooking.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to cancel this booking' });
    }

    // Update status to cancelled instead of deleting
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
