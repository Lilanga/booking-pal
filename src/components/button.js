import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

const Button = (props) => {

  const [clicked, setClicked] = useState(false);
  let clickedTimer;

  function handleClick(e) {
    setClicked(true);
    clickedTimer = setTimeout(
      () => setClicked(false),
      1000
    );

    props.handleClick(e);
  }

  useEffect(() => {
    return () => {
      clearTimeout(clickedTimer);
    };
  }, [clickedTimer]);

  const iconClasses = classNames('icon', `icon-${props.icon}`);
  const btnClasses = classNames({
    clicked: clicked,
    disabled: props.disabled
  }, props.className);

  return (
    <button onClick={handleClick} className={btnClasses} disabled={clicked} type="button">
      <i className={iconClasses} />
    </button>
  );
};

Button.propTypes = {
  icon: PropTypes.string.isRequired,
  handleClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  className: PropTypes.string
};

Button.defaultProps = {
  disabled: false
};

export default Button;
