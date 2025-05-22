/**
 * @jest-environment jsdom
 */

import { initBridge } from '../../native-bridge';
import type { WindowCapacitor } from '../definitions-internal';
import { createCapacitor } from '../runtime';
import { WebPlugin } from '../web-plugin';

const win = {};
initBridge(win);

class MockPlugin extends WebPlugin {
  trigger() {
    this.notifyListeners('test', {
      value: 'Capacitors on top of toast!',
    });
  }

  getListeners() {
    return this.listeners;
  }

  getWindowListeners() {
    return this.windowListeners;
  }

  registerFakeWindowListener() {
    this.registerWindowListener('fake', 'test');
  }
}

describe('Web Plugin', () => {
  let plugin: MockPlugin;
  let win: WindowCapacitor;

  beforeEach(() => {
    win = {};
    createCapacitor(win);
    plugin = new MockPlugin();
  });

  it('Should add event listeners', async () => {
    const lf = (event: any) => {
      console.log(event);
    };

    const handle = await plugin.addListener('test', lf);

    const listener = plugin.getListeners()['test'];
    expect(listener).not.toBe(undefined);
    expect(listener.length).toEqual(1);
    handle.remove();
  });

  it('Should manage multiple event listeners', async () => {
    const lf1 = (event: any) => {
      console.log(event);
    };
    const lf2 = (event: any) => {
      console.log(event);
    };
    const lf3 = (event: any) => {
      console.log(event);
    };
    const handle1 = await plugin.addListener('test', lf1);
    const handle2 = await plugin.addListener('test', lf2);
    const handle3 = await plugin.addListener('test', lf3);

    const listener = plugin.getListeners()['test'];
    expect(listener.length).toEqual(3);
    handle1.remove();
    expect(listener.length).toEqual(2);
    handle2.remove();
    expect(listener.length).toEqual(1);
    handle3.remove();
    expect(listener.length).toEqual(0);
  });

  it('Should remove event listeners', async () => {
    const lf = (event: any) => {
      console.log(event);
    };
    const handle = await plugin.addListener('test', lf);
    handle.remove();

    const listener = plugin.getListeners()['test'];
    expect(listener).toEqual([]);
  });

  it('Should notify listeners', async () => {
    const lf = jest.fn();
    const handle = await plugin.addListener('test', lf);

    plugin.trigger();

    expect(lf.mock.calls.length).toEqual(1);
    expect(lf.mock.calls[0][0]).toEqual({
      value: 'Capacitors on top of toast!',
    });
    handle.remove();
  });

  it('Should register and remove window listeners', async () => {
    const pluginAddWindowListener = jest.spyOn(
      MockPlugin.prototype as any,
      'addWindowListener',
    );
    plugin.registerFakeWindowListener();

    const lf = jest.fn();
    const handle = await plugin.addListener('test', lf);

    // Make sure the window listener was added
    let windowListener = plugin.getWindowListeners()['test'];
    expect(windowListener.registered).toEqual(true);
    expect(pluginAddWindowListener.mock.calls.length).toEqual(1);

    // Trigger a custom window event
    const event = new CustomEvent('fake', {
      detail: { value: 'Capacitors on top of toast!' },
    });
    window.dispatchEvent(event);

    expect(lf.mock.calls.length).toEqual(1);

    const eventArg = lf.mock.calls[0][0];
    expect(eventArg.detail.value).toEqual('Capacitors on top of toast!');

    handle.remove();
    windowListener = plugin.getWindowListeners()['test'];
    expect(windowListener.registered).toEqual(false);
  });

  it('Should only call window event if listeners bound', () => {
    plugin.registerFakeWindowListener();

    // Make sure the window listener was added
    const windowListener = plugin.getWindowListeners()['test'];

    expect(windowListener.registered).toEqual(false);

    const handlerFunction = jest.spyOn(windowListener, 'handler');
    // Trigger a custom window event
    const event = new CustomEvent('fake', {
      detail: { value: 'Capacitors on top of toast!' },
    });
    window.dispatchEvent(event);

    expect(handlerFunction).not.toHaveBeenCalled();
  });

  it('Should check if plugin has listeners for an event', async () => {
    // Create a mock for hasListeners that handles the case when the event doesn't exist
    const mockHasListeners = function(this: MockPlugin, eventName: string): boolean {
      return !!(this.listeners[eventName] && this.listeners[eventName].length);
    };
    
    // Replace the hasListeners method
    const originalHasListeners = (plugin as any).hasListeners;
    (plugin as any).hasListeners = mockHasListeners;
    
    try {
      // Initially there should be no listeners
      expect((plugin as any).hasListeners('test')).toBe(false);
      
      // Add a listener
      const lf = jest.fn();
      const handle = await plugin.addListener('test', lf);
      
      // Now it should have a listener
      expect((plugin as any).hasListeners('test')).toBe(true);
      
      // Remove the listener
      await handle.remove();
      
      // Now it should not have a listener again
      expect((plugin as any).hasListeners('test')).toBe(false);
    } finally {
      // Restore the original method
      (plugin as any).hasListeners = originalHasListeners;
    }
  });

  it('Should handle removeAllListeners correctly', async () => {
    // Add multiple listeners to multiple events
    const lf1 = jest.fn();
    const lf2 = jest.fn();
    const lf3 = jest.fn();
    
    await plugin.addListener('test1', lf1);
    await plugin.addListener('test2', lf2);
    await plugin.addListener('test3', lf3);
    
    // Register a window listener
    plugin.registerFakeWindowListener();
    await plugin.addListener('test', jest.fn());
    
    // Verify window listener is registered
    const windowListener = plugin.getWindowListeners()['test'];
    expect(windowListener.registered).toEqual(true);
    
    // Remove all listeners
    await plugin.removeAllListeners();
    
    // Verify all listeners are removed
    expect(Object.keys(plugin.getListeners()).length).toBe(0);
    
    // Verify window listeners are unregistered
    expect(Object.keys(plugin.getWindowListeners()).length).toBe(0);
  });

  it('Should create unimplemented and unavailable exceptions', () => {
    // Access the protected methods through type assertions
    const unimplemented = (plugin as any).unimplemented.bind(plugin);
    const unavailable = (plugin as any).unavailable.bind(plugin);
    
    // Test unimplemented with default message
    const unimplementedEx1 = unimplemented();
    expect(unimplementedEx1.message).toBe('not implemented');
    expect(unimplementedEx1.code).toBe('UNIMPLEMENTED');
    
    // Test unimplemented with custom message
    const unimplementedEx2 = unimplemented('custom message');
    expect(unimplementedEx2.message).toBe('custom message');
    expect(unimplementedEx2.code).toBe('UNIMPLEMENTED');
    
    // Test unavailable with default message
    const unavailableEx1 = unavailable();
    expect(unavailableEx1.message).toBe('not available');
    expect(unavailableEx1.code).toBe('UNAVAILABLE');
    
    // Test unavailable with custom message
    const unavailableEx2 = unavailable('custom unavailable message');
    expect(unavailableEx2.message).toBe('custom unavailable message');
    expect(unavailableEx2.code).toBe('UNAVAILABLE');
  });
});
