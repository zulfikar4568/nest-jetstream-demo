import { NatsJetStreamServer } from '@nestjs-plugins/nestjs-nats-jetstream-transport';
import { NestFactory } from '@nestjs/core';
import { CustomStrategy } from '@nestjs/microservices';
import { DiscardPolicy, RetentionPolicy, StorageType } from 'nats';
import { AppModule } from './app.module';

async function bootstrap() {
  const options: CustomStrategy = {
    strategy: new NatsJetStreamServer({
      connectionOptions: {
        servers: 'localhost:4222',
        name: 'myservice-listener',
      },
      consumerOptions: {
        deliverGroup: 'myservice-group', // string - ketika di set hanya akan mengirim message dari consumer ke subscriber yang mempunyai group cocok Analogi nya sama seperti di queue group nats
        durable: 'myservice-durable', // string - Durable subscriptions mengingat posisi merekeka ketika client disconnect
        deliverTo: 'myservice-messages', //string - Membuat  unique delivery_subject prefix.
        manualAck: true, // Tiap - tiap message harus di acknowledged secara manual (bisa di lihat contoh di controller)
        maxAckPending: 1024, // number (default: 1024) - Jumlah maksimal message akan di terima tanpa mengirim balik ACK
        ackWait: 30000, // (30s default) Waktu dalam nanoseconds yang mana server akan menunggu ack untuk tiap - tiap message. Jika tidak di acknowledge maka akan di kirim ulang tiap 30 detik
        // ackPolicy: Explicit | All | None (default: Excplicit )
        // Explicit tiap individual message harus di acknowledge.
        // All hanya perlu menandai message terakhir saja, otomatis msg sebelumnya menjadi ack
        // None tidak perlu men ack message apapun, server akan mengasumsi bahwa ack saat delivery.
        ackPolicy: 'Explicit',
        // deliverPolicy: All | Last | New | ByStartSequence | ByStartTime | last_per_subject (default: All) - Menspesifikasikan darimana stream akan mulai mengirim message
        // All(Default) Consumer akan menerima message dari awal message diterima.
        // Last Ketika pertama kali consume message. Consumer akan memulai menerima message dengan message yang terakhir di terima stream.
        // New Ketika pertama kali consume message, consumer hanya akan memulai menerima message yang sudah dibuat setelah consumer telah dibuat.
        // ByStartSequence Ketika pertama kali menerima message, dimulai dari set message tertentu, consumer harus menentukan startSequence, urutan sequence tertentu untuk consumer mulai consume.
        // ByStartTime Ketika pertama kali consume message, message mulai diterima pada atau setelah waktu ini.
        // last_per_subject Ketika pertama kali consume message, dimulai dengan yang terbaru untuk tiap tiap subject yang di filter saat ini di dalam stream.
        deliverPolicy: 'All',
        maxDeliver: -1, // Jumlah maksimal berapa kali tiap message bisa di deliver, applies ke message yang di kirim ulang karna issue ack policy
        maxMessages: -1, // Jumlah max message yang bisa ada di consumer
        // replayPolicy:  Instant | All | ByStartSequence | ByStartTime | Original (default: Instant)
        // Replay policy akan berlaku jika deliverPolicy All
        // ByStartSequence or ByStartTime mulai membaca stream pada posisi tertentu selain dari akhir
        // Original message di dalam stream akan di push ke client pada rate yang sama ketika original di terima.
        // Instant (default), message akan dikirim secepat mungkin, ketika mematuhi AckPolicy, MaxAckPending and dan kemampuan client untuk menkonsumsi semua message
        replayPolicy: 'All',
        description: 'This is consumer Group', // Deskripsi text
        headersOnly: false, //boolean - Konfigurasi consumer untuk hanya mengirim existing header dan Nats-Msg-Siz tanpa body
        sample: 100, // number - Set persentasi acknowledgements yang harus di sample untuk observability, 0-100.
      },
      streamConfig: {
        name: 'mystream', // Nama dari stream
        subjects: ['order.*'], // Nama subject yang nantinya message akan di ambil oleh stream
        num_replicas: 1, // Berapa banyak replicas untuk menyimpan setiap message di cluster JetStream, max 5
        discard: DiscardPolicy.Old, // Ketika stream mencapai limit DiscardNew akan menolak message baru, DiscardOld menghapus message lama
        duplicate_window: 120000000000, // untuk melacak message yang duplikat dalam (ns)
        max_age: 0, // Max umur message di stream (ns)
        max_msg_size: -1, // Ukuran terbesar message yang di perbolehkan oleh stream
        max_msgs: 10, // Berapa banyak jumlah message yang mungkin di simpan di stream, jika sudah melebihi jumlah message yang di tentukan akan menghapus message lama atau me-reject message baru
        max_msgs_per_subject: -1, // Jumlah maksimal msg per subject
        retention: RetentionPolicy.Limits, // Bagaimana retention di consider LimitsPolicy(default), InterestPolicy, WorkQueuePolicy
        // Tipe penyimpanan, File atau Memori
        // Jika disimpan di memory, saat server mati maka stream akan hilang
        // Jika di simpan di File, saat server mati maka stream tidak akan hilang begitu pula consumer, dan msg nya
        storage: StorageType.File,
      },
    }),
  };
  const app = await NestFactory.create(AppModule);
  const microservices = app.connectMicroservice(options);
  await microservices.listen();
  await app.listen(3000);
}
bootstrap();
