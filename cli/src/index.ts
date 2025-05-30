#!/usr/bin/env node

import { Command } from 'commander';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const program = new Command();

program
  .name('swaplite')
  .description('CLI client for SwapLite')
  .version('1.0.0');

// Add commands here
program
  .command('swap')
  .description('Execute a swap')
  .option('-f, --from <token>', 'Source token')
  .option('-t, --to <token>', 'Destination token')
  .option('-a, --amount <amount>', 'Amount to swap')
  .action((options) => {
    console.log('Swap command executed with options:', options);
    // Implement swap logic here
  });

program
  .command('balance')
  .description('Check token balance')
  .option('-t, --token <token>', 'Token to check balance for')
  .action((options) => {
    console.log('Balance command executed with options:', options);
    // Implement balance checking logic here
  });

program.parse(); 