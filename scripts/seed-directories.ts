/**
 * Seed script to populate the Supabase directories table with all 405+ directories
 *
 * Usage:
 *   npx tsx scripts/seed-directories.ts
 */

import { createClient } from '@supabase/supabase-js';
import { DIRECTORIES, mapTypeToDb } from '../src/lib/data/directories';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
	console.error('Missing required environment variables:');
	console.error('  PUBLIC_SUPABASE_URL:', SUPABASE_URL ? 'set' : 'MISSING');
	console.error('  SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_KEY ? 'set' : 'MISSING');
	process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
	auth: {
		autoRefreshToken: false,
		persistSession: false
	}
});

// PostgreSQL integer max is 2,147,483,647
const MAX_INT = 2147483647;

async function seedDirectories() {
	console.log(`\nSeeding ${DIRECTORIES.length} directories to Supabase...\n`);

	// Transform directories to match database schema
	const dbDirectories = DIRECTORIES.map(dir => ({
		id: dir.id,
		name: dir.name,
		url: dir.url,
		description: dir.description,
		logo_url: dir.logo_url,
		type: mapTypeToDb(dir.type), // Map forum/community to social
		categories: dir.categories,
		industries: dir.industries,
		business_types: dir.business_types,
		domain_authority: dir.domain_authority,
		monthly_traffic: Math.min(dir.monthly_traffic, MAX_INT), // Cap to prevent integer overflow
		tier: dir.tier,
		submission_type: dir.submission_type,
		submission_url: dir.submission_url,
		requires_account: dir.requires_account,
		is_free: dir.is_free,
		listing_fee: dir.listing_fee,
		review_time_days: dir.review_time_days,
		approval_rate: dir.approval_rate,
		is_active: dir.is_active
	}));

	// Process in batches of 50 for better performance
	const batchSize = 50;
	let successCount = 0;
	let errorCount = 0;

	for (let i = 0; i < dbDirectories.length; i += batchSize) {
		const batch = dbDirectories.slice(i, i + batchSize);
		const batchNum = Math.floor(i / batchSize) + 1;
		const totalBatches = Math.ceil(dbDirectories.length / batchSize);

		console.log(`Processing batch ${batchNum}/${totalBatches} (${batch.length} directories)...`);

		// Use upsert to handle re-runs (update existing, insert new)
		const { data, error } = await supabase
			.from('directories')
			.upsert(batch, {
				onConflict: 'url',
				ignoreDuplicates: false
			});

		if (error) {
			console.error(`  Error in batch ${batchNum}:`, error.message);
			errorCount += batch.length;
		} else {
			successCount += batch.length;
			console.log(`  Batch ${batchNum} complete`);
		}
	}

	console.log('\n========================================');
	console.log('Seeding complete!');
	console.log(`  Total directories: ${DIRECTORIES.length}`);
	console.log(`  Successfully seeded: ${successCount}`);
	console.log(`  Errors: ${errorCount}`);
	console.log('========================================\n');

	// Verify by counting
	const { count, error: countError } = await supabase
		.from('directories')
		.select('*', { count: 'exact', head: true });

	if (countError) {
		console.error('Error verifying count:', countError.message);
	} else {
		console.log(`Directories in database: ${count}`);
	}
}

// Run the seed function
seedDirectories().catch(console.error);
