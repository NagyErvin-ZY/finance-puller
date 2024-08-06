import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseInitService implements OnModuleInit {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async onModuleInit() {
    await this.createCalculateMovingAverageFunction();
  }

  private async createCalculateMovingAverageFunction() {
    await this.dataSource.query(`
      CREATE OR REPLACE FUNCTION calculate_moving_average(custom_period INTEGER) RETURNS TRIGGER AS $$
      DECLARE
          old_price NUMERIC;
          current_rolling_sum NUMERIC;
          current_count INTEGER;
          moving_avg NUMERIC;
      BEGIN
          -- Get the current rolling sum and count
          SELECT rolling_sum, count INTO current_rolling_sum, current_count FROM tempsum WHERE id = 1;

          -- If the number of prices is less than the custom period, just update the rolling sum and count
          IF current_count < custom_period THEN
              current_rolling_sum := current_rolling_sum + NEW.price;
              current_count := current_count + 1;
              moving_avg := current_rolling_sum / current_count;
              UPDATE tempsum SET rolling_sum = current_rolling_sum, count = current_count WHERE id = 1;
          ELSE
              -- Get the price to be subtracted (price at the current-period index)
              SELECT price INTO old_price FROM price_data ORDER BY id ASC LIMIT 1 OFFSET current_count - custom_period;

              -- Calculate the new rolling sum
              current_rolling_sum := current_rolling_sum - old_price + NEW.price;

              -- Calculate the moving average
              moving_avg := current_rolling_sum / custom_period;

              -- Update the rolling sum
              UPDATE tempsum SET rolling_sum = current_rolling_sum WHERE id = 1;
          END IF;

          -- Insert the moving average into the moving_average table
          INSERT INTO moving_average (moving_avg, timestamp) VALUES (moving_avg, NEW.timestamp);

          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
  }
}