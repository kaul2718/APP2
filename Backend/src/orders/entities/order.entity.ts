import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn, OneToMany, OneToOne, DeleteDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ActividadTecnica } from '../../actividad-tecnica/entities/actividad-tecnica.entity';
import { Presupuesto } from '../../presupuesto/entities/presupuesto.entity';
import { DetalleRepuestos } from '../../detalle-repuestos/entities/detalle-repuesto.entity';
import { Casillero } from 'src/casillero/entities/casillero.entity';
import { EstadoOrden } from 'src/common/enums/estadoOrden.enum';
import { EstadoFinal } from 'src/common/enums/estadoFinalOrden';
import { TareaRealizar } from 'src/common/enums/tareaRealizar.enum';
import { Equipo } from '../../equipo/entities/equipo.entity';
import { EvidenciaTecnica } from 'src/evidencia-tecnica/entities/evidencia-tecnica.entity';

@Entity()
export class Order {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    workOrderNumber: string;

    @ManyToOne(() => User, (user) => user.clientOrders)
    @JoinColumn({ name: 'clientId' })
    client: User;

    @Column({ nullable: true })
    clientId: number;

    @ManyToOne(() => User, (user) => user.technicianOrders, { nullable: true })
    @JoinColumn({ name: 'technicianId' })
    technician: User;

    @Column({ nullable: true })
    technicianId: number;

    @OneToMany(() => ActividadTecnica, (actividadTecnica) => actividadTecnica.orden, {
        cascade: true,
        eager: true,
    })
    actividades: ActividadTecnica[];

    @CreateDateColumn({ type: 'timestamp' })
    fechaIngreso: Date;

    // Relación OneToOne con Equipo (Opción A)
    @ManyToOne(() => Equipo, (equipo) => equipo.ordenes, {
        nullable: false,
        onDelete: 'RESTRICT', // o SET NULL según tu preferencia
    })
    @JoinColumn({ name: 'equipoId' })
    equipo: Equipo;

    @Column()
    equipoId: number;


    @Column()
    problemaReportado: string;

    @Column('simple-array')
    accesorios: string[];

    @Column({
        type: 'enum',
        enum: EstadoOrden,
        default: EstadoOrden.PENDIENTE,
    })
    estado: EstadoOrden;

    @Column({
        type: 'enum',
        enum: EstadoFinal,
        default: EstadoFinal.NO_ENTREGADO,
    })
    estadoFinal: EstadoFinal;

    @Column({
        type: 'enum',
        enum: TareaRealizar,
        default: TareaRealizar.REVISION,
    })
    tareaRealizar: string;

    @Column({ nullable: true })
    fechaPrometidaEntrega: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    fechaActualizacion: Date;

    @OneToOne(() => Presupuesto, (presupuesto) => presupuesto.orden, {
        cascade: true,
    })
    presupuesto: Presupuesto;

    @OneToMany(() => DetalleRepuestos, (detalle) => detalle.order, {
        cascade: true,
    })
    detallesRepuestos: DetalleRepuestos[];



    @OneToOne(() => Casillero, (casillero) => casillero.order, {
        cascade: true,
    })
    casillero: Casillero;
    // order.entity.ts (o donde esté tu entidad)
    @Column({ default: false })
    isDeleted: boolean;

    @DeleteDateColumn({ nullable: true })
    deletedAt?: Date;

    @OneToMany(() => EvidenciaTecnica, (evidencia) => evidencia.orden, {
        cascade: true,
    })
    evidencias: EvidenciaTecnica[];

}
