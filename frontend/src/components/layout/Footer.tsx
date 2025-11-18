import React from 'react';
import { Layout, Row, Col, Space } from 'antd';
import { GithubOutlined, TwitterOutlined, FacebookOutlined } from '@ant-design/icons';

const { Footer: AntFooter } = Layout;

const Footer: React.FC = () => {
  return (
    <AntFooter style={{ textAlign: 'center', background: '#001529', color: 'rgba(255,255,255,0.65)' }}>
      <Row gutter={[16, 16]} style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Col xs={24} sm={8}>
          <h3 style={{ color: '#fff' }}>CardSky</h3>
          <p>Your trusted card distribution platform</p>
        </Col>
        <Col xs={24} sm={8}>
          <h4 style={{ color: '#fff' }}>Quick Links</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <a href="/" style={{ color: 'rgba(255,255,255,0.65)' }}>Home</a>
            <a href="/search" style={{ color: 'rgba(255,255,255,0.65)' }}>Browse Cards</a>
            <a href="/about" style={{ color: 'rgba(255,255,255,0.65)' }}>About Us</a>
            <a href="/contact" style={{ color: 'rgba(255,255,255,0.65)' }}>Contact</a>
          </div>
        </Col>
        <Col xs={24} sm={8}>
          <h4 style={{ color: '#fff' }}>Follow Us</h4>
          <Space size="large">
            <GithubOutlined style={{ fontSize: '24px', color: '#fff', cursor: 'pointer' }} />
            <TwitterOutlined style={{ fontSize: '24px', color: '#fff', cursor: 'pointer' }} />
            <FacebookOutlined style={{ fontSize: '24px', color: '#fff', cursor: 'pointer' }} />
          </Space>
        </Col>
      </Row>
      <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
        CardSky ©{new Date().getFullYear()} - All Rights Reserved
      </div>
    </AntFooter>
  );
};

export default Footer;
