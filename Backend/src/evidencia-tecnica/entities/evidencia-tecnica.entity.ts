import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn, DeleteDateColumn } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { User } from '../../users/entities/user.entity';
import { EstadoOrden } from '../../estado-orden/entities/estado-orden.entity';

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

    @ManyToOne(() => EstadoOrden, { nullable: true })
    @JoinColumn({ name: 'estadoOrdenId' })
    estadoOrden: EstadoOrden;

    @Column({ nullable: true })
    estadoOrdenId: number;

    @Column({ type: 'varchar', length: 500, nullable: true })
    storageKey?: string; // Clave de objeto en Cloudflare R2 (ej: ordenes/14/evidencias/imagenes/uuid.jpg)

    @Column({ type: 'varchar', length: 255, nullable: true })
    nombreOriginal?: string; // Nombre original del archivo

    @Column({ type: 'varchar', length: 100, nullable: true })
    mimeType?: string; // Tipo MIME (ej: image/jpeg, video/mp4)

    @Column({ type: 'bigint', nullable: true })
    tamanoBytes?: number; // Tamaño del archivo en bytes

    @Column({ type: 'varchar', length: 30, default: 'r2' })
    storageProvider: 'r2' | 'local' | 'legacy_base64';

    @Column({ type: 'text', nullable: true })
    archivoUrl?: string; // URL firmada temporal generada dinámicamente o Base64 legado

    @Column('varchar', { length: 50 })
    tipoArchivo: 'imagen' | 'video'; // Simple clasificación


    @Column({ type: 'text', nullable: true })
    descripcion: string;

    @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    fechaSubida: Date;

    @DeleteDateColumn({ nullable: true })
    deletedAt?: Date;
}
