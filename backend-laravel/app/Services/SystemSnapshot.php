<?php

declare(strict_types=1);

namespace App\Services;

class SystemSnapshot
{
    private string $path;
    private ?array $cache = null;

    public function __construct()
    {
        $this->path = storage_path('app/monitor-snapshot.json');
    }

    public function get(string $section): ?array
    {
        $all = $this->read();
        return $all[$section]['data'] ?? null;
    }

    public function getAll(): array
    {
        $all = $this->read();
        $result = [];
        foreach ($all as $section => $entry) {
            $result[$section] = $entry['data'] ?? null;
        }
        return $result;
    }

    public function isStale(string $section, int $intervalSec): bool
    {
        $all = $this->read();
        if (!isset($all[$section])) {
            return true;
        }
        $updatedAt = $all[$section]['updated_at'] ?? 0;
        return (time() - $updatedAt) >= $intervalSec;
    }

    public function has(string $section): bool
    {
        $all = $this->read();
        if (!isset($all[$section])) {
            return false;
        }
        $data = $all[$section]['data'] ?? null;
        return is_array($data) && count($data) > 0;
    }

    public function exists(): bool
    {
        return file_exists($this->path) && filesize($this->path) > 10;
    }

    public function put(string $section, array $data): void
    {
        if (empty($data)) {
            return;
        }

        $all = $this->read();
        $existing = $all[$section]['data'] ?? null;

        if (is_array($existing) && count($existing) > 0 && $this->isDataEmpty($data)) {
            return;
        }

        $all[$section] = [
            'data' => $data,
            'updated_at' => time(),
        ];
        $this->write($all);
    }

    public function putMany(array $sections): void
    {
        $all = $this->read();
        $now = time();
        foreach ($sections as $section => $data) {
            if (empty($data)) {
                continue;
            }
            $existing = $all[$section]['data'] ?? null;
            if (is_array($existing) && count($existing) > 0 && $this->isDataEmpty($data)) {
                continue;
            }
            $all[$section] = [
                'data' => $data,
                'updated_at' => $now,
            ];
        }
        $this->write($all);
    }

    public function getStaleSections(array $intervals): array
    {
        $all = $this->read();
        $stale = [];
        foreach ($intervals as $section => $intervalSec) {
            if (!isset($all[$section])) {
                $stale[] = $section;
                continue;
            }
            $updatedAt = $all[$section]['updated_at'] ?? 0;
            if ((time() - $updatedAt) >= $intervalSec) {
                $stale[] = $section;
            }
        }
        return $stale;
    }

    public function getAge(string $section): int
    {
        $all = $this->read();
        if (!isset($all[$section])) {
            return PHP_INT_MAX;
        }
        $updatedAt = $all[$section]['updated_at'] ?? 0;
        return time() - $updatedAt;
    }

    public function clear(): void
    {
        $this->cache = null;
        if (file_exists($this->path)) {
            @unlink($this->path);
        }
    }

    private function isDataEmpty(array $data): bool
    {
        if (count($data) === 0) {
            return true;
        }
        $nonEmpty = 0;
        foreach ($data as $value) {
            if (is_array($value)) {
                if (count($value) > 0) {
                    $nonEmpty++;
                }
            } elseif ($value !== null && $value !== '' && $value !== 0 && $value !== 0.0 && $value !== false) {
                $nonEmpty++;
            }
        }
        return $nonEmpty === 0;
    }

    private function read(): array
    {
        if ($this->cache !== null) {
            return $this->cache;
        }

        if (!file_exists($this->path)) {
            $this->cache = [];
            return $this->cache;
        }

        $content = @file_get_contents($this->path);
        if ($content === false || $content === '') {
            $this->cache = [];
            return $this->cache;
        }

        $decoded = json_decode($content, true);
        $this->cache = is_array($decoded) ? $decoded : [];

        return $this->cache;
    }

    private function write(array $data): void
    {
        $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        $tmp = $this->path . '.tmp';
        file_put_contents($tmp, $json, LOCK_EX);
        rename($tmp, $this->path);
        $this->cache = $data;
    }
}
