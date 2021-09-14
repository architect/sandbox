<?php

$config = json_decode(getenv('__ARC_CONFIG__'), true);
require $config['handlerFile'].".php";

$handlerFn = $config['handlerFunction'];

$con = getenv('__ARC_CONTEXT__');

$event = json_decode(trim(fgets(STDIN)), true);

$context = json_decode($con);

$result = '__ARC__ ' . json_encode(call_user_func($handlerFn, $event, $context)) . ' __ARC_END__';

print $result;