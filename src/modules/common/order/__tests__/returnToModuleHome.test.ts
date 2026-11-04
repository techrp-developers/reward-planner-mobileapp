import { returnToModuleHome } from '../returnToModuleHome';

const navigator = (routeNames: string[], parent?: any) => ({
  getState: () => ({ routeNames }), getParent: () => parent, reset: jest.fn(),
});

describe('post-payment home navigation', () => {
  it('clears checkout history and returns to the current module home', () => {
    const nav = navigator(['Home', 'OrderStepUI', 'OrderConfirm']);
    returnToModuleHome(nav);
    expect(nav.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Home' }] });
  });
  it('returns root-level order details to the dashboard', () => {
    const nav = navigator(['Home', 'Dashboard', 'OrderConfirmedScreen']);
    returnToModuleHome(nav);
    expect(nav.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Dashboard' }] });
  });
  it('finds home in a parent navigator', () => {
    const parent = navigator(['Home']);
    returnToModuleHome(navigator(['Receipt'], parent));
    expect(parent.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Home' }] });
  });
  it('supports the bus module home route', () => {
    const nav = navigator(['DineOutModule', 'PaymentScreen']);
    returnToModuleHome(nav);
    expect(nav.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'DineOutModule' }] });
  });
});
