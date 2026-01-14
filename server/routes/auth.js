const express = require('express');
const router = express.Router();
const { supabase } = require('../utils/supabase');
const { generateToken } = require('../utils/auth');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    console.log('📝 [Server] Register request received');
    console.log('📝 [Server] Request body:', { email: req.body.email, fullName: req.body.fullName });

    const { email, password, fullName } = req.body;

    if (!email || !password) {
      console.log('❌ [Server] Missing email or password');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    console.log('📝 [Server] Calling Supabase signUp...');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || ''
        },
        emailRedirectTo: undefined,
        autoConfirm: true
      }
    });

    console.log('📝 [Server] Supabase signUp response:', { hasData: !!data, hasError: !!error });

    if (error) {
      console.log('❌ [Server] Supabase error:', error.message);

      // Si l'erreur est "Database error saving new user", on essaie de créer le profil manuellement
      if (error.message === 'Database error saving new user' && data?.user) {
        console.log('⚙️ [Server] Attempting manual profile creation...');

        try {
          // Créer le profil manuellement en utilisant le service role
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email,
              full_name: fullName || ''
            });

          if (profileError) {
            console.log('❌ [Server] Manual profile creation failed:', profileError.message);
            return res.status(400).json({ error: 'Failed to create user profile: ' + profileError.message });
          }

          console.log('✅ [Server] Manual profile creation successful');

          // Continuer avec la génération du token
          const token = generateToken({ id: data.user.id, email: data.user.email });

          console.log('✅ [Server] Registration successful (with manual profile), sending response');
          return res.status(201).json({
            message: 'User registered successfully',
            user: {
              id: data.user.id,
              email: data.user.email,
              fullName: fullName
            },
            token
          });
        } catch (profileErr) {
          console.log('❌ [Server] Exception during manual profile creation:', profileErr);
          return res.status(500).json({ error: 'Failed to complete registration' });
        }
      }

      return res.status(400).json({ error: error.message });
    }

    console.log('📝 [Server] Generating token for user:', data.user.id);
    const token = generateToken({ id: data.user.id, email: data.user.email });

    console.log('✅ [Server] Registration successful, sending response');
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.user_metadata.full_name
      },
      token
    });
  } catch (error) {
    console.error('❌ [Server] Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({ id: data.user.id, email: data.user.email });

    res.json({
      message: 'Login successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.user_metadata.full_name
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/profile', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: profile?.full_name || user.user_metadata.full_name
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
