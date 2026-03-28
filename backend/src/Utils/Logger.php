<?php

namespace App\Utils;

class Logger {
  private static string $logDir = __DIR__ . '/../../../logs';

  // INFO 레벨 로그
  public static function info(string $message, array $context = []): void {
    self::write('INFO', $message, $context);
  }

  // ERROR 레벨 로그
  public static function error(string $message, array $context = []): void {
    self::write('ERROR', $message, $context);
  }

  // WARNING 레벨 로그
  public static function warning(string $message, array $context = []): void {
    self::write('WARNING', $message, $context);
  }

  private static function write(string $level, string $message, array $context): void {
    if (!is_dir(self::$logDir)) {
      mkdir(self::$logDir, 0755, true);
    }

    $timestamp = date('Y-m-d H:i:s');
    $contextStr = empty($context) ? '' : ' ' . json_encode($context, JSON_UNESCAPED_UNICODE);
    $logLine = "[{$timestamp}] [{$level}] {$message}{$contextStr}" . PHP_EOL;

    $logFile = self::$logDir . '/' . date('Y-m-d') . '.log';
    file_put_contents($logFile, $logLine, FILE_APPEND | LOCK_EX);
  }
}
