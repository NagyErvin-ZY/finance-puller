import { Column, Entity, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import Pair from "./pair.entity";

@Entity()
export default class RegisteredMovingAverage {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => Pair)
    pair: Pair;

    @Column()
    period: number;
}