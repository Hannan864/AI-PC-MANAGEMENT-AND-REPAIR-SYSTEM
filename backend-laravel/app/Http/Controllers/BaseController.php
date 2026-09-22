<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

/**
 * Controller: BaseController
 *
 * Provides standardized JSON response formatting for all API endpoints.
 * Ensures consistent envelope structure consumed by both React and Flutter.
 *
 * Response envelope format:
 *   Success: { "success": true,  "message": "...", "data": {...} }
 *   Error:   { "success": false, "message": "...", "errors": {...} }
 */
abstract class BaseController extends Controller
{
    use AuthorizesRequests, ValidatesRequests;

    /**
     * Send a success response with data payload.
     */
    protected function sendResponse(
        mixed $result,
        string $message = 'Success',
        int $code = 200,
    ): JsonResponse {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $result,
        ], $code);
    }

    /**
     * Send an error response with optional validation errors.
     */
    protected function sendError(
        string $message = 'An error occurred',
        mixed $errors = [],
        int $code = 400,
    ): JsonResponse {
        $response = [
            'success' => false,
            'message' => $message,
        ];

        if (! empty($errors)) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $code);
    }

    /**
     * Send a simple message response without data payload.
     */
    protected function sendMessage(
        string $message = 'Operation completed',
        int $code = 200,
    ): JsonResponse {
        return response()->json([
            'success' => true,
            'message' => $message,
        ], $code);
    }

    protected function execWithTimeout(string $command, int $timeoutMs = 5000): array
    {
        $output = [];
        $descriptors = [
            0 => ['pipe', 'r'],
            1 => ['pipe', 'w'],
            2 => ['pipe', 'w'],
        ];
        $process = @proc_open($command, $descriptors, $pipes);
        if (is_resource($process)) {
            fclose($pipes[0]);
            $start = microtime(true);
            while (true) {
                $status = proc_get_status($process);
                if (!$status['running']) break;
                if ((microtime(true) - $start) * 1000 > $timeoutMs) {
                    proc_terminate($process, 9);
                    proc_close($process);
                    return $output;
                }
                usleep(100000);
            }
            $output = explode("\n", stream_get_contents($pipes[1]));
            fclose($pipes[1]);
            fclose($pipes[2]);
            proc_close($process);
        }
        return $output;
    }
}
