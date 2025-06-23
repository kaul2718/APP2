import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn, DeleteDateColumn } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
export class EvidenciaTecnica {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Order, (order) => order.evidencias, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'ordenId' })
    orden: Order;

    @Column()
    ordenId: number;

    // Relación con el usuario que subió la evidencia
    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'subidoPorId' })
    subidoPor: User;

    @Column({ type: 'text' })
    urlImagen: string;

    @Column({ type: 'text', nullable: true })
    descripcion: string;

    @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    fechaSubida: Date;

    @Column({ default: false })
    isDeleted: boolean;

    @DeleteDateColumn({ nullable: true })
    deletedAt?: Date;
}
