import { Entity, ManyToOne, PrimaryColumn } from "typeorm";
import Pair from "./pair.entity";

@Entity()
export default class RegisteredMovingAverage {
    @ManyToOne(() => Pair)
    pair: Pair;

    @PrimaryColumn()
    period: number;
}