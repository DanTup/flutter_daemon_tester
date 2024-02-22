import 'dart:async';
import 'dart:convert';
import 'dart:io';

Future<void> main() async {
  var events = 0;
  var completer = Completer<void>();
  stdin.transform(utf8.decoder).listen(
    (event) async {
      events++;
      print('Got $event on stdin ($events/10)');
      if (events == 10) {
        print('Got 10 events, exiting');
        completer.complete();
      }
    },
    onDone: () => print('stdin is done!'),
  );

  await completer.future;
}
