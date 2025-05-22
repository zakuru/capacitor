/**
 * @jest-environment jsdom
 */

import type { WindowCapacitor } from '../definitions-internal';
import { ExceptionCode, getPlatformId, CapacitorException } from '../util';

describe('util', () => {
  describe('getPlatformId', () => {
    it('should return "android" when androidBridge is present', () => {
      const win: WindowCapacitor = {
        androidBridge: {
          postMessage: () => {
            // Mock implementation
          },
        },
      };
      expect(getPlatformId(win)).toBe('android');
    });

    it('should return "ios" when webkit.messageHandlers.bridge is present', () => {
      const win: WindowCapacitor = {
        webkit: {
          messageHandlers: {
            bridge: {
              postMessage: () => {
                // Mock implementation
              },
            },
          },
        },
      };
      expect(getPlatformId(win)).toBe('ios');
    });

    it('should return "web" when neither android nor ios bridges are present', () => {
      const win: WindowCapacitor = {};
      expect(getPlatformId(win)).toBe('web');
    });

    it('should return "web" when win is undefined', () => {
      const win: WindowCapacitor = undefined as any;
      expect(getPlatformId(win)).toBe('web');
    });
  });

  describe('CapacitorException', () => {
    it('should create an exception with message only', () => {
      const exception = new CapacitorException('Test message');
      expect(exception.message).toBe('Test message');
      expect(exception.code).toBeUndefined();
      expect(exception.data).toBeUndefined();
    });

    it('should create an exception with message and code', () => {
      const exception = new CapacitorException('Test message', ExceptionCode.Unimplemented);
      expect(exception.message).toBe('Test message');
      expect(exception.code).toBe(ExceptionCode.Unimplemented);
      expect(exception.data).toBeUndefined();
    });

    it('should create an exception with message, code, and data', () => {
      const data = { foo: 'bar' };
      const exception = new CapacitorException('Test message', ExceptionCode.Unavailable, data);
      expect(exception.message).toBe('Test message');
      expect(exception.code).toBe(ExceptionCode.Unavailable);
      expect(exception.data).toBe(data);
    });
  });
});