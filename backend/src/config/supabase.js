const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Suas credenciais do CORE
const SUPABASE_URL = 'https://rsmhekhrmdhsetytdcnn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_b77BeOvIxJ0I1Cazy4QATQ_5dFE3T8B';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = supabase;