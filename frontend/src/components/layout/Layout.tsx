import { Box, styled } from '@mui/material';

const LayoutRoot = styled(Box)({
  display: 'flex',
  minHeight: '100vh',
  backgroundColor: '#0A1929',
});

const Sidebar = styled(Box)({
  width: 260,
  backgroundColor: '#0A1929',
  borderRight: '1px solid rgba(255, 255, 255, 0.1)',
  display: 'flex',
  flexDirection: 'column',
});

const MainContent = styled(Box)({
  flex: 1,
  backgroundColor: '#0A1929',
  display: 'flex',
  flexDirection: 'column',
});

const Logo = styled(Box)({
  padding: '24px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  '& h1': {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: 600,
    color: '#fff',
  },
  '& span': {
    fontSize: '0.875rem',
    color: 'rgba(255, 255, 255, 0.7)',
  },
});

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <LayoutRoot>
      <Sidebar>
        <Logo>
          <h1>OBJECT STORE</h1>
          <span>Enterprise Storage</span>
        </Logo>
        {/* Navigation will be rendered here */}
      </Sidebar>
      <MainContent>
        {children}
      </MainContent>
    </LayoutRoot>
  );
}; 