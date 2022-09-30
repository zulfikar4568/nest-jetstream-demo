import { NatsJetStreamClient } from '@nestjs-plugins/nestjs-nats-jetstream-transport';
import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { PubAck } from 'nats';

interface OrderCreatedEvent {
  id: number;
  product: string;
  quantity: number;
}
interface OrderUpdatedEvent {
  id: number;
  quantity: number;
}
interface OrderDeleteEvent {
  id: number;
}

const ORDER_CREATED = 'order.created';
const ORDER_UPDATED = 'order.updated';
const ORDER_DELETED = 'order.deleted';

@Injectable()
export class AppService {
  constructor(private client: NatsJetStreamClient) {}

  createOrder(): string {
    this.client
      .emit<OrderCreatedEvent>(ORDER_CREATED, {
        id: 1,
        product: 'Socks',
        quantity: 1,
      })
      .subscribe((pubAck) => {
        console.log('publish Ack: ', pubAck);
      });
    return 'order created!';
  }

  updateOrder(): string {
    this.client
      .emit<OrderUpdatedEvent>(ORDER_UPDATED, { id: 1, quantity: 10 })
      .subscribe((pubAck) => {
        console.log('publish Ack: ', pubAck);
      });
    return 'order updated';
  }

  deleteOrder(): string {
    this.client
      .emit<OrderDeleteEvent>(ORDER_DELETED, { id: 1 })
      .subscribe((pubAck) => {
        console.log('publish Ack: ', pubAck);
      });
    return 'order deleted';
  }

  // request - response
  accumulate(payload: number[]): Observable<PubAck> {
    const pattern = { cmd: 'sum' };
    return this.client.send<number[]>(pattern, payload);
  }
}
