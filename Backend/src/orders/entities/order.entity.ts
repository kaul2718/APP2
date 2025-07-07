import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn, OneToMany, OneToOne, DeleteDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ActividadTecnica } from '../../actividad-tecnica/entities/actividad-tecnica.entity';
import { Presupuesto } from '../../presupuesto/entities/presupuesto.entity';
import { DetalleRepuestos } from '../../detalle-repuestos/entities/detalle-repuesto.entity';
import { Casillero } from 'src/casillero/entities/casillero.entity';
import { Equipo } from '../../equipo/entities/equipo.entity';
import { EvidenciaTecnica } from 'src/evidencia-tecnica/entities/evidencia-tecnica.entity';
import { EstadoOrden } from 'src/estado-orden/entities/estado-orden.entity';
import { HistorialEstadoOrden } from 'src/historial-estado-orden/entities/historial-estado-orden.entity';

@Entity('orders')
export class Order {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    workOrderNumber: string;

    @Column({ default: true })
    estado: boolean;

    // RELACIONES QUE DEBEN IR CON RESPECTO A QUE CLIENTE LE PERTENECE, Y EL TECNICO ASIGNADO 
    @ManyToOne(() => User, (user) => user.clientOrders)
    @JoinColumn({ name: 'clientId' })
    client: User;

    @Column({ nullable: true })
    clientId: number;

    //TECNICO
    @ManyToOne(() => User, (user) => user.technicianOrders, { nullable: true })
    @JoinColumn({ name: 'technicianId' })
    technician: User;

    @Column({ nullable: true })
    technicianId: number;

    //RECEPCIONISTA
    @ManyToOne(() => User, (user) => user.recepcionistaOrders, { nullable: true })
    @JoinColumn({ name: 'recepcionistaId' })
    recepcionista: User;

    @Column({ nullable: true })
    recepcionistaId: number;


    //REALCION CON EVIDENCIA TECNICA, YA SEA LO QUE EL DIAGNOSTICO O LO QUE REALICE EL TECNICO
    @OneToMany(() => ActividadTecnica, (actividadTecnica) => actividadTecnica.orden, {
        cascade: true,
        eager: true,
    })
    actividades: ActividadTecnica[];

    // RELACION CON EQUIPO YA QUE UN CLIENTE TIENE UN EQUIPO 
    @ManyToOne(() => Equipo, (equipo) => equipo.ordenes, {
        nullable: false,
        onDelete: 'RESTRICT', // o SET NULL según tu preferencia
    })
    @JoinColumn({ name: 'equipoId' })
    equipo: Equipo;

    @Column()
    equipoId: number;

    // UN CAMPO PARA QUE EL RECEPCIONISTA INGRESE EN UN STRING EL PROBLEMA
    @Column()
    problemaReportado: string;

    // UN CAMPO PARA QUE EL RECEPCIONISTA INGRESE EN UN STRING 
    @Column('simple-array', { nullable: true })
    accesorios: string[];

    // FECHA QUE SE PROMETE ENTREGAR
    @Column({ nullable: true })
    fechaPrometidaEntrega: Date;

    //RELACION HACIA PRESUPUESTO
    @OneToOne(() => Presupuesto, (presupuesto) => presupuesto.orden, {
        cascade: true,
        nullable: true, // la orden puede existir sin presupuesto aún

    })
    presupuesto: Presupuesto;

    //RELACION HACIA CASILLERO 
    @OneToOne(() => Casillero, (casillero) => casillero.order, {
        cascade: true,
    })
    casillero: Casillero;


    //RELACION HACIA EVIDENCIA TECNICA
    @OneToMany(() => EvidenciaTecnica, (evidencia) => evidencia.orden, {
        cascade: true,
    })
    evidencias: EvidenciaTecnica[];

    //RELACION HACIA ESTADO ORDEN 
    @ManyToOne(() => EstadoOrden, { nullable: true }) // <- también aquí
    @JoinColumn({ name: 'estadoOrdenId' })
    estadoOrden: EstadoOrden;

    @Column({ nullable: true })
    estadoOrdenId: number;

    //RELACION CON HISTORIAL DE ESTADOS

    @OneToMany(() => HistorialEstadoOrden, (historial) => historial.orden, {
        cascade: true,
    })
    historialEstados: HistorialEstadoOrden[];


    //ELIMINACION LOGICA
    @DeleteDateColumn({ type: 'timestamp', nullable: true })
    deletedAt: Date | null;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;

}
