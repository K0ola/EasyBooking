const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPolicies() {
  console.log('🔍 Vérification de la configuration Supabase...\n');

  // 1. Vérifier si la table profiles existe
  console.log('1️⃣ Vérification de la table profiles...');
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Erreur lors de la lecture de profiles:', error.message);
      console.log('   💡 Solution: Exécutez le fichier database_schema.sql dans Supabase SQL Editor\n');
    } else {
      console.log('✅ Table profiles existe\n');
    }
  } catch (err) {
    console.log('❌ Table profiles n\'existe pas ou n\'est pas accessible');
    console.log('   💡 Solution: Exécutez le fichier database_schema.sql dans Supabase SQL Editor\n');
  }

  // 2. Tester l'inscription
  console.log('2️⃣ Test d\'inscription...');
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'test123456';

  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User'
        }
      }
    });

    if (error) {
      console.log('❌ Erreur lors de l\'inscription:', error.message);

      if (error.message.includes('Database error saving new user')) {
        console.log('\n🔍 DIAGNOSTIC:');
        console.log('   Cette erreur indique que la policy INSERT est manquante sur la table profiles');
        console.log('\n💡 SOLUTION:');
        console.log('   1. Allez sur https://supabase.com/dashboard');
        console.log('   2. Ouvrez votre projet');
        console.log('   3. Allez dans SQL Editor');
        console.log('   4. Exécutez ce SQL:\n');
        console.log('   CREATE POLICY "Allow automatic profile creation" ON profiles');
        console.log('     FOR INSERT');
        console.log('     WITH CHECK (true);\n');
      }
    } else {
      console.log('✅ Inscription réussie!');
      console.log('   User ID:', data.user.id);
      console.log('   Email:', data.user.email);

      // Vérifier si le profil a été créé
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profile) {
        console.log('✅ Profil créé automatiquement');
      } else {
        console.log('⚠️  Profil NON créé (trigger manquant)');
      }
    }
  } catch (err) {
    console.log('❌ Erreur lors du test:', err.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('FIN DU DIAGNOSTIC');
  console.log('='.repeat(60));
}

checkPolicies();
