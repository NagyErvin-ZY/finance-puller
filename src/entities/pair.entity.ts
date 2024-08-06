// pair.entity typeorm
import { Entity, PrimaryGeneratedColumn, Column, PrimaryColumn } from 'typeorm';


@Entity()
export default class Pair {
  @PrimaryColumn()
  base: string;

  @PrimaryColumn()
  quote: string;
}