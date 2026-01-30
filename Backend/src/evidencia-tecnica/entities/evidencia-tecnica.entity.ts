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

    @Column()
    subidoPorId: number;

    @Column('text')
    archivoUrl: string; // Aquí guardas la URL de la imagen/video (puede ser base64 o path en servidor)

    @Column('varchar', { length: 50 })
    tipoArchivo: 'imagen' | 'video'; // Simple clasificación

    @Column({ type: 'text', nullable: true })
    descripcion: string;

    @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    fechaSubida: Date;

    @DeleteDateColumn({ nullable: true })
    deletedAt?: Date;
}
